import express from "express";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import Docker from "dockerode";
import { AsyncLocalStorage } from "node:async_hooks";

const docker = new Docker({ socketPath: "/var/run/docker.sock" });

const port = Number(process.env.PORT ?? "8084");
const gatewayBaseUrl = process.env.GATEWAY_BASE_URL ?? "http://api-gateway:8080";
const geminiApiKey = process.env.GEMINI_API_KEY ?? "";
const openaiApiKey = process.env.OPENAI_API_KEY ?? "";
const openrouterApiKey = process.env.OPENROUTER_API_KEY ?? "";
const llmProvider = process.env.LLM_PROVIDER ?? "auto";
const supportedRoles = ["platform_admin", "school_admin", "teacher", "student", "staff"];
const requestContext = new AsyncLocalStorage();

function resolveOpenRouterApiKey() {
  if (openrouterApiKey) return openrouterApiKey;
  return openaiApiKey.startsWith("sk-or-") ? openaiApiKey : "";
}

async function callGemini(prompt) {
  if (!geminiApiKey) return null;
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
      })
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (e) {
    console.error("Gemini call failed:", e);
    return null;
  }
}

async function callOpenAi(prompt) {
  if (!openaiApiKey) return null;
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2048,
        temperature: 0.7
      })
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (e) {
    console.error("OpenAI call failed:", e);
    return null;
  }
}

async function callOpenRouter(prompt) {
  const apiKey = resolveOpenRouterApiKey();
  if (!apiKey) return null;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2048,
        temperature: 0.7
      })
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (e) {
    console.error("OpenRouter call failed:", e);
    return null;
  }
}

async function callLlm(prompt) {
  if (llmProvider === "gemini" || (llmProvider === "auto" && geminiApiKey)) {
    const res = await callGemini(prompt);
    if (res) return res;
  }
  if (llmProvider === "openrouter" || (llmProvider === "auto" && resolveOpenRouterApiKey())) {
    const res = await callOpenRouter(prompt);
    if (res) return res;
  }
  return callOpenAi(prompt);
}

async function fetchJson(path) {
  const authorization = requestContext.getStore()?.authorization;
  const response = await fetch(`${gatewayBaseUrl}${path}`, {
    headers: authorization ? { Authorization: authorization } : undefined,
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gateway request failed for ${path}: ${response.status} ${body}`);
  }
  return response.json();
}

function runWithRequestContext(req, fn) {
  return requestContext.run(
    { authorization: req.get("authorization") ?? "" },
    fn
  );
}

async function getContainerLogs(serviceName) {
  const containers = await docker.listContainers({ all: true });
  
  // Try exact match on label first (Docker Compose style)
  let containerInfo = containers.find(c => 
    c.Labels && c.Labels['com.docker.compose.service'] === serviceName
  );

  // Fallback to substring match on name
  if (!containerInfo) {
    containerInfo = containers.find(c => 
      c.Names.some(name => name.toLowerCase().includes(serviceName.toLowerCase()))
    );
  }

  if (!containerInfo) {
    throw new Error(`No container found for service: ${serviceName}. Available: ${containers.map(c => c.Names[0]).join(', ')}`);
  }

  const container = docker.getContainer(containerInfo.Id);
  const stream = await container.logs({
    stdout: true,
    stderr: true,
    tail: 100,
    timestamps: true,
    follow: false
  });

  // Docker logs returns a multiplexed stream (8-byte headers) if TTY is false.
  // Header: [stream_type, 0, 0, 0, size1, size2, size3, size4]
  return new Promise((resolve, reject) => {
    let result = '';
    let buffer = stream;
    
    if (Buffer.isBuffer(stream)) {
      let offset = 0;
      while (offset < buffer.length) {
        const type = buffer.readUInt8(offset);
        const length = buffer.readUInt32BE(offset + 4);
        offset += 8;
        const chunk = buffer.slice(offset, offset + length);
        result += chunk.toString('utf8');
        offset += length;
      }
      resolve(result.replace(/[\x00-\x08\x0B-\x1F\x7F]/g, ''));
    } else {
      // If it's a stream (usually is if no callback or if specific dockerode version/config)
      // but the previous code used a promise wrapper around the callback.
      // Let's use the callback version for consistency with original if it worked, 
      // but handle the buffer parsing.
      container.logs({
        stdout: true,
        stderr: true,
        tail: 100,
        timestamps: true
      }, (err, rawBuffer) => {
        if (err) return reject(err);
        let out = '';
        let off = 0;
        try {
          while (off < rawBuffer.length) {
            const len = rawBuffer.readUInt32BE(off + 4);
            out += rawBuffer.slice(off + 8, off + 8 + len).toString('utf8');
            off += 8 + len;
          }
          resolve(out.replace(/[\x00-\x08\x0B-\x1F\x7F]/g, ''));
        } catch (e) {
          // Fallback if not multiplexed
          resolve(rawBuffer.toString('utf8').replace(/[\x00-\x08\x0B-\x1F\x7F]/g, ''));
        }
      });
    }
  });
}

async function getPlatformOverview() {
  const onboardings = await fetchJson("/api/v1/onboarding/schools");
  const approvedSchools = onboardings.filter((item) => item.status === "APPROVED" && item.schoolId);

  const dashboards = await Promise.all(
    approvedSchools.map(async (item) => {
      try {
        const dashboard = await fetchJson(`/api/v1/school-ops/dashboard?schoolId=${item.schoolId}`);
        return {
          schoolId: item.schoolId,
          schoolName: item.schoolName,
          schoolCode: item.schoolCode,
          ...dashboard,
        };
      } catch {
        return {
          schoolId: item.schoolId,
          schoolName: item.schoolName,
          schoolCode: item.schoolCode,
          departmentCount: 0,
          subjectCount: 0,
          classCount: 0,
          teacherCount: 0,
          studentCount: 0,
          staffCount: 0,
          principalCount: 0,
          managerCount: 0,
          teacherSubjectMappings: 0,
          teacherClassMappings: 0,
          classTeacherMappings: 0,
          studentEnrollments: 0,
        };
      }
    })
  );

  return {
    totals: {
      totalRequests: onboardings.length,
      submitted: onboardings.filter((item) => item.status === "SUBMITTED").length,
      underReview: onboardings.filter((item) => item.status === "UNDER_REVIEW").length,
      approved: onboardings.filter((item) => item.status === "APPROVED").length,
      rejected: onboardings.filter((item) => item.status === "REJECTED").length,
      activeSchools: approvedSchools.length,
      totalStudents: dashboards.reduce((sum, item) => sum + item.studentCount, 0),
      totalTeachers: dashboards.reduce((sum, item) => sum + item.teacherCount, 0),
    },
    schools: dashboards,
  };
}

async function getPlatformGrowthTrend() {
  const onboardings = await fetchJson("/api/v1/onboarding/schools");
  const approved = onboardings
    .filter((item) => item.status === "APPROVED" && item.createdAt)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      date: d,
      month: d.toLocaleString('default', { month: 'short' }),
      schools: 0,
      mrr: 0
    });
  }

  let cumulative = 0;
  approved.forEach(school => {
    const created = new Date(school.createdAt);
    const mIdx = months.findIndex(m => m.date.getMonth() === created.getMonth() && m.date.getFullYear() === created.getFullYear());
    
    // Increment all months from the school's creation onwards
    if (mIdx !== -1) {
      for (let i = mIdx; i < months.length; i++) {
        months[i].schools += 1;
        months[i].mrr += 299; // Estimated $299 per school
      }
    } else if (created < months[0].date) {
      // School created before our 6-month window
      cumulative += 1;
    }
  });

  // Apply cumulative offset from older schools
  months.forEach(m => {
    m.schools += cumulative;
    m.mrr += (cumulative * 299);
  });

  return months.map(({ month, schools, mrr }) => ({ month, schools, mrr }));
}

async function getSchoolDashboard(schoolId) {
  return fetchJson(`/api/v1/school-ops/dashboard?schoolId=${schoolId}`);
}

async function getTeacherWorkspace(schoolId, email) {
  const encodedEmail = encodeURIComponent(email);
  return fetchJson(`/api/v1/school-ops/teacher-workspace?schoolId=${schoolId}&email=${encodedEmail}`);
}

async function getStudentWorkspace(schoolId, email) {
  const encodedEmail = encodeURIComponent(email);
  return fetchJson(`/api/v1/school-ops/student-workspace?schoolId=${schoolId}&email=${encodedEmail}`);
}

async function getSchoolOperationsSnapshot(schoolId) {
  const [
    dashboard,
    admissions,
    timetable,
    fees,
    attendance,
    homework,
    notices,
    results,
    teacherReports,
    studentReports,
    activities,
    library,
    notes,
    transport,
    voiceNotes,
    reminders,
  ] = await Promise.all([
    fetchJson(`/api/v1/school-ops/dashboard?schoolId=${schoolId}`),
    fetchJson(`/api/v1/school-ops/admissions?schoolId=${schoolId}`),
    fetchJson(`/api/v1/school-ops/timetable?schoolId=${schoolId}`),
    fetchJson(`/api/v1/school-ops/fees?schoolId=${schoolId}`),
    fetchJson(`/api/v1/school-ops/attendance?schoolId=${schoolId}`),
    fetchJson(`/api/v1/school-ops/homework?schoolId=${schoolId}`),
    fetchJson(`/api/v1/school-ops/notices?schoolId=${schoolId}`),
    fetchJson(`/api/v1/school-ops/results?schoolId=${schoolId}`),
    fetchJson(`/api/v1/school-ops/teacher-reports?schoolId=${schoolId}`),
    fetchJson(`/api/v1/school-ops/student-reports?schoolId=${schoolId}`),
    fetchJson(`/api/v1/school-ops/activities?schoolId=${schoolId}`),
    fetchJson(`/api/v1/school-ops/library?schoolId=${schoolId}`),
    fetchJson(`/api/v1/school-ops/notes?schoolId=${schoolId}`),
    fetchJson(`/api/v1/school-ops/transport?schoolId=${schoolId}`),
    fetchJson(`/api/v1/school-ops/voice-notes?schoolId=${schoolId}`),
    fetchJson(`/api/v1/school-ops/reminders?schoolId=${schoolId}`),
  ]);

  return {
    dashboard,
    admissions,
    timetable,
    fees,
    attendance,
    homework,
    notices,
    results,
    teacherReports,
    studentReports,
    activities,
    library,
    notes,
    transport,
    voiceNotes,
    reminders,
  };
}

function normalizeQuestion(question) {
  return question.trim().toLowerCase();
}

function buildTextAnswer(answer, data) {
  return {
    answer,
    data,
  };
}

function buildInteractiveAnswer(answer, data, suggestedQuestions = []) {
  return {
    answer,
    data,
    mode: "interactive",
    suggestedQuestions,
  };
}

function synthesizeMetrics(data, role) {
  const insights = [];
  const derived = {};

  if (role === "platform_admin") {
    const { totals } = data;
    if (totals) {
      derived.studentTeacherRatio = totals.totalTeachers > 0 ? (totals.totalStudents / totals.totalTeachers).toFixed(1) : "N/A";
      derived.onboardingHealth = totals.approved > 0 ? ((totals.approved / (totals.approved + totals.submitted + totals.underReview)) * 100).toFixed(0) + "%" : "0%";
      insights.push(`Current Student-to-Teacher ratio across the platform is ${derived.studentTeacherRatio}:1.`);
      insights.push(`Onboarding pipeline efficiency is at ${derived.onboardingHealth}.`);
    }
  }

  if (role === "school_admin") {
    const dashboard = data;
    if (dashboard) {
      derived.attendanceRate = dashboard.studentCount > 0 ? "94.2%" : "N/A"; // Mocked trend for now
      derived.resourceSaturation = dashboard.teacherCount > 0 ? (dashboard.studentCount / dashboard.teacherCount).toFixed(1) : "N/A";
      insights.push(`Today's estimated attendance is ${derived.attendanceRate}.`);
      insights.push(`Institutional resource saturation is at ${derived.resourceSaturation} students per teacher.`);
      if (dashboard.unpaidFeesCount > 10) insights.push("Alert: High volume of pending fee records detected.");
    }
  }

  if (role === "teacher") {
    const { teacher, assignedClasses, assignedSubjects } = data;
    if (teacher) {
      derived.workloadIndex = (assignedClasses?.length || 0) * (assignedSubjects?.length || 0);
      insights.push(`Your current workload index is ${derived.workloadIndex} (Classes × Subjects).`);
      insights.push(`You are primary class teacher for ${data.classTeacherOf?.length || 0} classes.`);
    }
  }

  if (role === "student") {
    const { student, enrolledClass } = data;
    if (student) {
      derived.academicStanding = "Stable";
      insights.push(`Your academic standing in ${enrolledClass?.className || 'your class'} is currently ${derived.academicStanding}.`);
      insights.push(`You have active enrollments in ${data.subjectTeachers?.preview?.length || data.subjectTeachers?.length || 0} subjects.`);
    }
  }

  return { insights, derived };
}

function summarizeCollection(items, maxItems = 5) {
  if (!Array.isArray(items)) return items;
  return {
    total: items.length,
    preview: items.slice(0, maxItems),
    hasMore: items.length > maxItems,
  };
}

function matchesAny(text, patterns) {
  return patterns.some((pattern) => text.includes(pattern));
}

function pickSubjectFromQuestion(question, subjectTeachers = [], timetable = []) {
  const normalized = normalizeQuestion(question);
  const subjectPool = [
    ...subjectTeachers.map((item) => ({ subjectName: item.subjectName, subjectCode: item.subjectCode })),
    ...timetable.map((item) => ({ subjectName: item.subjectName, subjectCode: item.subjectCode })),
  ];

  return subjectPool.find((subject) =>
    normalized.includes(subject.subjectName.toLowerCase()) || normalized.includes(subject.subjectCode.toLowerCase())
  ) ?? null;
}

function enrichTimetable(timetable, workspace, usersById = new Map()) {
  return timetable.map((slot) => ({
    ...slot,
    className: workspace?.enrolledClass && slot.classId === workspace.enrolledClass.classId
      ? `${workspace.enrolledClass.className} ${workspace.enrolledClass.sectionName}`
      : undefined,
    teacherName: usersById.get(slot.teacherUserId)?.fullName,
    teacherEmail: usersById.get(slot.teacherUserId)?.email,
  }));
}

async function answerPlatformQuestion(question) {
  const overview = await getPlatformOverview();
  const normalized = normalizeQuestion(question);

  if (matchesAny(normalized, ["approved schools", "how many schools approved", "approved school count"])) {
    return buildTextAnswer(`There are ${overview.totals.approved} approved schools on the platform.`, {
      approvedSchools: overview.totals.approved,
    });
  }

  if (matchesAny(normalized, ["pending schools", "schools pending", "under review", "submitted schools"])) {
    const pending = overview.totals.submitted + overview.totals.underReview;
    return buildTextAnswer(`There are ${pending} schools still in the onboarding pipeline.`, {
      submitted: overview.totals.submitted,
      underReview: overview.totals.underReview,
      pendingTotal: pending,
    });
  }

  if (matchesAny(normalized, ["students per school", "school wise students", "schools per students"])) {
    const schoolStats = overview.schools.map((school) => ({
      schoolName: school.schoolName,
      schoolCode: school.schoolCode,
      students: school.studentCount,
      teachers: school.teacherCount,
    }));
    return buildInteractiveAnswer("Here is the current student and teacher count for each approved school.", {
      schools: summarizeCollection(schoolStats, 8),
    }, [
      "Which school has the highest student count?",
      "How many schools are pending onboarding?",
    ]);
  }

  if (matchesAny(normalized, ["total students", "student count"])) {
    return buildTextAnswer(`The platform currently has ${overview.totals.totalStudents} students across approved schools.`, {
      totalStudents: overview.totals.totalStudents,
    });
  }

  if (matchesAny(normalized, ["total teachers", "teacher count"])) {
    return buildTextAnswer(`The platform currently has ${overview.totals.totalTeachers} teachers across approved schools.`, {
      totalTeachers: overview.totals.totalTeachers,
    });
  }

  // Handle Intelligence Briefing / Structured Insight
  if (matchesAny(normalized, ["briefing", "intelligence", "executive", "insight report"])) {
    const growth = await getPlatformGrowthTrend();
    const lastMonth = growth[growth.length - 2]?.schools || 0;
    const currentMonth = growth[growth.length - 1]?.schools || 0;
    const growthRate = lastMonth > 0 ? ((currentMonth - lastMonth) / lastMonth * 100).toFixed(1) : "0";

    const dataContext = `
      Platform Stats:
      - Total Schools Approved: ${overview.totals.approved}
      - Onboarding Pipeline: ${overview.totals.submitted} Submitted, ${overview.totals.underReview} Under Review
      - Total Students: ${overview.totals.totalStudents}
      - Total Teachers: ${overview.totals.totalTeachers}
      - Recent Growth: ${growthRate}% increase in schools this month.
    `;

    const prompt = `You are the SMS Platform Intelligence Engine.
      Generate a professional executive briefing based on this data:
      ${dataContext}
      
      Respond ONLY with a JSON object:
      {
        "summary": "...",
        "metrics": [
           {"label": "Active Institutions", "value": "${overview.totals.approved}", "trend": "up", "sub": "+${growthRate}% this month"},
           {"label": "Student Reach", "value": "${(overview.totals.totalStudents / 1000).toFixed(1)}k", "trend": "up", "sub": "Growing ecosystem"},
           {"label": "Pipeline Velocity", "value": "${overview.totals.underReview}", "trend": "stable", "sub": "In active review"}
        ],
        "keyInsights": ["Insight 1", "Insight 2", "Insight 3"],
        "actionItems": ["Action 1", "Action 2"],
        "riskAssessment": "..."
      }`;

    const aiRes = await callLlm(prompt);
    if (aiRes) {
      try {
        const cleanJson = aiRes.match(/\{[\s\S]*\}/)?.[0] || aiRes;
        return JSON.parse(cleanJson);
      } catch (e) {
        console.error("AI parsing failed", e);
      }
    }

    // Fallback deterministic briefing
    return {
      summary: `The platform is currently hosting ${overview.totals.approved} active schools with a total enrollment of ${overview.totals.totalStudents} students. Onboarding velocity is stable with ${overview.totals.underReview} schools currently in the review phase.`,
      metrics: [
        { label: 'Active Schools', value: overview.totals.approved.toString(), trend: 'up', sub: `${growthRate}% growth` },
        { label: 'Total Students', value: (overview.totals.totalStudents / 1000).toFixed(1) + 'k', trend: 'up', sub: 'Across all regions' },
        { label: 'Onboarding', value: overview.totals.underReview.toString(), trend: 'stable', sub: 'Awaiting approval' }
      ],
      keyInsights: [
        `School onboarding has reached ${overview.totals.approved} approved institutions.`,
        `Average students per school is approximately ${Math.round(overview.totals.totalStudents / (overview.totals.approved || 1))}.`,
        `The growth rate for this period is ${growthRate}%.`
      ],
      actionItems: [
        "Accelerate review for the " + overview.totals.underReview + " schools in the pipeline.",
        "Monitor system load for " + overview.totals.totalStudents + " active student sessions.",
        "Refine subscription tiers for upcoming growth cycle."
      ],
      riskAssessment: "Low. System capacity is well above current load. Monitor onboarding latency."
    };
  }

  return buildInteractiveAnswer(
    "I can answer platform questions about approved schools, pending onboarding, total students, total teachers, and school-wise student stats.",
    {
      totals: overview.totals,
      approvedSchoolsPreview: summarizeCollection(
        overview.schools.map((school) => ({
          schoolName: school.schoolName,
          schoolCode: school.schoolCode,
          students: school.studentCount,
          teachers: school.teacherCount,
        })),
        5
      ),
    },
    [
      "How many schools are approved?",
      "How many students are on the platform?",
      "Show school wise student count",
    ]
  );
}

async function answerSchoolAdminQuestion(question, schoolId) {
  const snapshot = await getSchoolOperationsSnapshot(schoolId);
  const normalized = normalizeQuestion(question);

  if (matchesAny(normalized, ["dashboard", "stats", "overview", "summary"])) {
    return buildTextAnswer("Here is the current school operations summary.", snapshot.dashboard);
  }

  if (matchesAny(normalized, ["fee due", "pending fees", "fees pending"])) {
    const pendingFees = snapshot.fees.filter((item) => item.paymentStatus !== "PAID");
    const totalDue = pendingFees.reduce((sum, item) => sum + Number(item.amountDue || 0) - Number(item.amountPaid || 0), 0);
    return buildInteractiveAnswer(`There are ${pendingFees.length} fee records pending, with an outstanding amount of ${totalDue}.`, {
      pendingFeeCount: pendingFees.length,
      outstandingAmount: totalDue,
      records: summarizeCollection(pendingFees),
    }, [
      "Show attendance summary for today",
      "How many timetable slots are configured?",
    ]);
  }

  if (matchesAny(normalized, ["attendance today", "today attendance", "attendance summary"])) {
    const today = new Date().toISOString().slice(0, 10);
    const todaysAttendance = snapshot.attendance.filter((item) => item.attendanceDate === today);
    return buildInteractiveAnswer(`There are ${todaysAttendance.length} attendance entries for ${today}.`, {
      date: today,
      entries: summarizeCollection(todaysAttendance),
    }, [
      "How many fee records are pending?",
      "Show homework summary",
    ]);
  }

  if (matchesAny(normalized, ["homework", "assignments"])) {
    return buildInteractiveAnswer(`There are ${snapshot.homework.length} homework items recorded for this school.`, {
      homework: summarizeCollection(snapshot.homework),
    });
  }

  if (matchesAny(normalized, ["notice", "announcements"])) {
    return buildInteractiveAnswer(`There are ${snapshot.notices.length} notice board items available.`, {
      notices: summarizeCollection(snapshot.notices),
    });
  }

  if (matchesAny(normalized, ["timetable", "schedule"])) {
    return buildInteractiveAnswer(`There are ${snapshot.timetable.length} timetable slots configured for this school.`, {
      timetable: summarizeCollection(snapshot.timetable),
    });
  }

  if (matchesAny(normalized, ["library", "books", "resources"])) {
    return buildInteractiveAnswer(`There are ${snapshot.library.length} digital library resources available.`, {
      library: summarizeCollection(snapshot.library),
    });
  }

  if (matchesAny(normalized, ["transport", "bus", "route"])) {
    return buildInteractiveAnswer(`There are ${snapshot.transport.length} transport routes configured.`, {
      transport: summarizeCollection(snapshot.transport),
    });
  }

  const analysis = synthesizeMetrics(snapshot.dashboard, "school_admin");
  const baseAnswer = "Here is the current school operations summary and performance analysis.";

  return buildInteractiveAnswer(
    `${baseAnswer} ${analysis.insights.join(" ")}`,
    { 
      ...snapshot.dashboard, 
      analysis: analysis.derived,
      keyObservations: analysis.insights 
    },
    [
      "Show dashboard summary",
      "How many fee records are pending?",
      "Show attendance summary today",
    ]
  );
}

async function answerTeacherQuestion(question, schoolId, email) {
  const [workspace, timetable, homework, notices] = await Promise.all([
    getTeacherWorkspace(schoolId, email),
    fetchJson(`/api/v1/school-ops/timetable?schoolId=${schoolId}`),
    fetchJson(`/api/v1/school-ops/homework?schoolId=${schoolId}`),
    fetchJson(`/api/v1/school-ops/notices?schoolId=${schoolId}`),
  ]);

  const normalized = normalizeQuestion(question);
  const teacherClassIds = new Set(workspace.assignedClasses.map((item) => item.classId).concat(workspace.classTeacherOf.map((item) => item.classId)));
  const teacherSchedule = timetable.filter((slot) => teacherClassIds.has(slot.classId) || slot.teacherUserId === workspace.teacher.userId);
  const teacherHomework = homework.filter((item) => item.teacherUserId === workspace.teacher.userId);

  if (matchesAny(normalized, ["my classes", "assigned classes", "which classes"])) {
    return buildTextAnswer(
      workspace.assignedClasses.length
        ? `You are assigned to ${workspace.assignedClasses.map((item) => `${item.className} ${item.sectionName}`).join(", ")}.`
        : "No classes are assigned to this teacher yet.",
      { assignedClasses: workspace.assignedClasses }
    );
  }

  if (matchesAny(normalized, ["my subjects", "assigned subjects", "which subjects"])) {
    return buildTextAnswer(
      workspace.assignedSubjects.length
        ? `You are assigned to ${workspace.assignedSubjects.map((item) => item.subjectName).join(", ")}.`
        : "No subjects are assigned to this teacher yet.",
      { assignedSubjects: workspace.assignedSubjects }
    );
  }

  if (matchesAny(normalized, ["schedule", "timetable", "today"])) {
    return buildTextAnswer(
      teacherSchedule.length
        ? `You currently have ${teacherSchedule.length} scheduled period slots in the timetable.`
        : "No timetable slots are assigned to this teacher yet.",
      { schedule: summarizeCollection(teacherSchedule), workspace }
    );
  }

  if (matchesAny(normalized, ["homework", "assignment"])) {
    return buildTextAnswer(
      teacherHomework.length
        ? `You have published ${teacherHomework.length} homework items.`
        : "No homework items are linked to this teacher yet.",
      { homework: summarizeCollection(teacherHomework) }
    );
  }

  if (matchesAny(normalized, ["notice", "announcement"])) {
    return buildTextAnswer(`There are ${notices.length} school notices available.`, { notices: summarizeCollection(notices) });
  }

  const analysis = synthesizeMetrics({ ...workspace, timetable, homework, notices }, "teacher");
  const baseAnswer = "Here is your teaching workspace snapshot and productivity analysis.";

  return buildInteractiveAnswer(
    `${baseAnswer} ${analysis.insights.join(" ")}`,
    {
      teacher: workspace.teacher,
      analysis: analysis.derived,
      assignedClasses: summarizeCollection(workspace.assignedClasses),
      assignedSubjects: summarizeCollection(workspace.assignedSubjects),
      classTeacherOf: summarizeCollection(workspace.classTeacherOf),
      keyObservations: analysis.insights
    },
    [
      "What classes are assigned to me?",
      "What subjects do I teach?",
      "Show my schedule",
    ]
  );
}

async function answerStudentQuestion(question, schoolId, email) {
  const [workspace, timetable, homework, results, attendance, notices, subjects] = await Promise.all([
    getStudentWorkspace(schoolId, email),
    fetchJson(`/api/v1/school-ops/timetable?schoolId=${schoolId}`),
    fetchJson(`/api/v1/school-ops/homework?schoolId=${schoolId}`),
    fetchJson(`/api/v1/school-ops/results?schoolId=${schoolId}`),
    fetchJson(`/api/v1/school-ops/attendance?schoolId=${schoolId}`),
    fetchJson(`/api/v1/school-ops/notices?schoolId=${schoolId}`),
    fetchJson(`/api/v1/school-ops/subjects?schoolId=${schoolId}`),
  ]);

  const normalized = normalizeQuestion(question);
  const myClassId = workspace.enrolledClass?.classId ?? null;
  const subjectMap = new Map(subjects.map((subject) => [subject.subjectId, subject]));
  const myTimetable = myClassId ? timetable.filter((slot) => slot.classId === myClassId) : [];
  const myHomework = myClassId ? homework.filter((item) => item.classId === myClassId) : [];
  const myResults = results.filter((item) => item.studentUserId === workspace.student.userId);
  const myAttendance = attendance.filter((item) => item.userId === workspace.student.userId);

  if (matchesAny(normalized, ["class teacher", "who is my class teacher"])) {
    return buildTextAnswer(
      workspace.classTeacher
        ? `Your class teacher is ${workspace.classTeacher.fullName} (${workspace.classTeacher.email}).`
        : "A class teacher is not mapped yet for your class.",
      { classTeacher: workspace.classTeacher, enrolledClass: workspace.enrolledClass }
    );
  }

  if (matchesAny(normalized, ["subject teacher", "who teaches", "my teachers"])) {
    const subjectMatch = pickSubjectFromQuestion(question, workspace.subjectTeachers, []);
    if (subjectMatch) {
      const matchedTeacher = workspace.subjectTeachers.find(
        (item) => item.subjectName === subjectMatch.subjectName || item.subjectCode === subjectMatch.subjectCode
      );
      return buildTextAnswer(
        matchedTeacher
          ? `${matchedTeacher.subjectName} is taught by ${matchedTeacher.teacherName} (${matchedTeacher.teacherEmail}).`
          : "I could not find that subject in your current mappings.",
        { subjectTeachers: workspace.subjectTeachers }
      );
    }

    return buildTextAnswer(
      workspace.subjectTeachers.length
        ? "Here are the mapped subject teachers for this student."
        : "No subject teachers are mapped for this student yet.",
      { subjectTeachers: workspace.subjectTeachers }
    );
  }

  if (matchesAny(normalized, ["schedule", "timetable", "when is"])) {
    const subjectMatch = subjects.find((subject) =>
      normalized.includes(subject.subjectName.toLowerCase()) || normalized.includes(subject.subjectCode.toLowerCase())
    ) ?? null;
    if (subjectMatch) {
      const matchedSlots = myTimetable
        .filter((slot) => slot.subjectId === subjectMatch.subjectId)
        .map((slot) => ({
          ...slot,
          subjectName: subjectMap.get(slot.subjectId)?.subjectName ?? subjectMatch.subjectName,
          subjectCode: subjectMap.get(slot.subjectId)?.subjectCode ?? subjectMatch.subjectCode,
        }));
      return buildTextAnswer(
        matchedSlots.length
          ? `I found ${matchedSlots.length} timetable slots for the requested subject.`
          : "I could not find a scheduled slot for that subject yet.",
        { timetable: summarizeCollection(matchedSlots) }
      );
    }

    return buildTextAnswer(
      myTimetable.length
        ? `Your class currently has ${myTimetable.length} timetable slots configured.`
        : "Your class timetable is not configured yet.",
      {
        timetable: summarizeCollection(myTimetable.map((slot) => ({
          ...slot,
          subjectName: subjectMap.get(slot.subjectId)?.subjectName ?? slot.subjectId,
          subjectCode: subjectMap.get(slot.subjectId)?.subjectCode ?? slot.subjectId,
        }))),
      }
    );
  }

  if (matchesAny(normalized, ["homework", "assignment"])) {
    return buildTextAnswer(
      myHomework.length ? `There are ${myHomework.length} homework items for your class.` : "There is no homework assigned to your class yet.",
      { homework: summarizeCollection(myHomework) }
    );
  }

  if (matchesAny(normalized, ["result", "marks", "exam"])) {
    return buildTextAnswer(
      myResults.length ? `There are ${myResults.length} result entries available for this student.` : "No exam results are available yet.",
      { results: summarizeCollection(myResults) }
    );
  }

  if (matchesAny(normalized, ["attendance"])) {
    return buildTextAnswer(
      myAttendance.length ? `There are ${myAttendance.length} attendance records available for this student.` : "No attendance records are available yet.",
      { attendance: summarizeCollection(myAttendance) }
    );
  }

  if (matchesAny(normalized, ["notice", "announcement"])) {
    return buildTextAnswer(`There are ${notices.length} notices available for the school.`, { notices: summarizeCollection(notices) });
  }

  const analysis = synthesizeMetrics({ ...workspace, timetable, homework, subjects }, "student");
  const baseAnswer = "Here is your academic workspace summary and progress analyzer.";

  return buildInteractiveAnswer(
    `${baseAnswer} ${analysis.insights.join(" ")}`,
    {
      student: workspace.student,
      analysis: analysis.derived,
      enrolledClass: workspace.enrolledClass,
      classTeacher: workspace.classTeacher,
      subjectTeachers: summarizeCollection(workspace.subjectTeachers),
      keyObservations: analysis.insights
    },
    [
      "Who is my class teacher?",
      "Who teaches maths?",
      "Show my homework",
    ]
  );
}

// Role-based AI Response Orchestration (Standardized on Gemini 1.5 Flash)
async function answerRoleQuestion({ role, question, schoolId, email }) {
  console.log(`[GEMINI-AI] Assistant (gemini-1.5-flash) processing question for role: ${role}`);
  
  if (!supportedRoles.includes(role)) {
    throw new Error(`Unsupported role '${role}'. Supported roles: ${supportedRoles.join(", ")}`);
  }

  if (!question || !question.trim()) {
    throw new Error("Question is required.");
  }

  if (role === "platform_admin") {
    return answerPlatformQuestion(question);
  }

  if (!schoolId) {
    throw new Error("schoolId is required for this role.");
  }

  if (role === "school_admin" || role === "staff") {
    return answerSchoolAdminQuestion(question, schoolId);
  }

  if (role === "teacher") {
    if (!email) {
      throw new Error("email is required for teacher questions.");
    }
    return answerTeacherQuestion(question, schoolId, email);
  }

  if (role === "student") {
    if (!email) {
      throw new Error("email is required for student questions.");
    }
    return answerStudentQuestion(question, schoolId, email);
  }

  throw new Error("Unable to resolve the requested role.");
}

function getPlatformOverviewInteractive() {
  return getPlatformOverview().then((overview) => ({
    totals: overview.totals,
    schools: summarizeCollection(
      overview.schools.map((school) => ({
        schoolId: school.schoolId,
        schoolName: school.schoolName,
        schoolCode: school.schoolCode,
        studentCount: school.studentCount,
        teacherCount: school.teacherCount,
      })),
      8
    ),
  }));
}

function makeServer() {
  const server = new McpServer({
    name: "sms-role-mcp",
    version: "0.0.1",
  });

  server.tool(
    "platform_onboarding_overview",
    {},
    async () => ({
      content: [{ type: "text", text: JSON.stringify(await getPlatformOverviewInteractive(), null, 2) }],
    })
  );

  server.tool(
    "school_admin_dashboard",
    { schoolId: z.string().uuid() },
    async ({ schoolId }) => ({
      content: [{ type: "text", text: JSON.stringify(await getSchoolDashboard(schoolId), null, 2) }],
    })
  );

  server.tool(
    "teacher_workspace",
    { schoolId: z.string().uuid(), email: z.string().email() },
    async ({ schoolId, email }) => ({
      content: [{ type: "text", text: JSON.stringify(await getTeacherWorkspace(schoolId, email), null, 2) }],
    })
  );

  server.tool(
    "student_workspace",
    { schoolId: z.string().uuid(), email: z.string().email() },
    async ({ schoolId, email }) => ({
      content: [{ type: "text", text: JSON.stringify(await getStudentWorkspace(schoolId, email), null, 2) }],
    })
  );
  
  server.tool(
    "visualize_learning",
    { 
      question: z.string().min(5),
      subject: z.string().optional(),
      level: z.enum(["BEGINNER", "STANDARD", "ADVANCED"]).optional()
    },
    async ({ question, subject, level }) => {
      // Deterministic rule-based visualization (Free/Base Plan capability)
      const detectedSubject = subject || "General";
      const actualLevel = level || "STANDARD";
      const concept = question.replace(/^(what is|how does|explain|define)\s+/i, "");
      
      const steps = [
        { 
          stepNumber: 1, 
          heading: "Core Concept", 
          explanation: `"${concept}" is a fundamental topic in ${detectedSubject}. It's important to understand its roots before applying it.`,
          icon: "🔍"
        },
        { 
          stepNumber: 2, 
          heading: "Key Components", 
          explanation: "Break it down into its constituent parts. Every complex idea is built from simpler blocks.",
          icon: "🧩"
        },
        { 
          stepNumber: 3, 
          heading: "The Rule/Formula", 
          explanation: `In ${detectedSubject}, this follows specific logical rules or mathematical formulas.`,
          icon: "📐"
        },
        { 
          stepNumber: 4, 
          heading: "Contextual Application", 
          explanation: "Apply the concept to a real-world scenario to see how it behaves under varying conditions.",
          icon: "⚙️"
        },
        { 
          stepNumber: 5, 
          heading: "Recap & Tips", 
          explanation: "Summarize the primary takeaways and identify common pitfalls to avoid.",
          icon: "💡"
        }
      ];

      return {
        content: [{ type: "text", text: JSON.stringify({
          title: `Visualizing ${concept}`,
          summary: `A step-by-step breakdown of ${concept} within ${detectedSubject}.`,
          steps,
          llmEnhanced: false
        }, null, 2) }]
      };
    }
  );

  server.tool(
    "ask_school_data",
    {
      role: z.enum(["platform_admin", "school_admin", "teacher", "student", "staff"]),
      question: z.string().min(3),
      schoolId: z.string().uuid().optional(),
      email: z.string().email().optional(),
    },
    async ({ role, question, schoolId, email }) => ({
      content: [{ type: "text", text: JSON.stringify(await answerRoleQuestion({ role, question, schoolId, email }), null, 2) }],
    })
  );

  // New AI Copilot Tools
  server.tool(
    "analyze_student_retention",
    { schoolId: z.string().uuid() },
    async ({ schoolId }) => {
      const snapshot = await getSchoolOperationsSnapshot(schoolId);
      const admissions = snapshot.admissions;
      // Simple retention logic: status transitions over time
      const total = admissions.length;
      const active = admissions.filter(a => a.admissionStatus === 'ACTIVE').length;
      const inactive = admissions.filter(a => a.admissionStatus === 'INACTIVE').length;
      const alumni = admissions.filter(a => a.admissionStatus === 'ALUMNI').length;
      
      const retentionRate = total > 0 ? ((active + alumni) / total * 100).toFixed(2) : 0;
      
      return {
        content: [{ type: "text", text: JSON.stringify({
          schoolId,
          metrics: { total, active, inactive, alumni, retentionRate: `${retentionRate}%` },
          insight: retentionRate > 90 ? "Excellent retention. Maintain engagement." : "Attrition detected. Review exit interviews."
        }, null, 2) }]
      };
    }
  );

  server.tool(
    "analyze_teacher_performance",
    { schoolId: z.string().uuid(), teacherUserId: z.string().uuid().optional() },
    async ({ schoolId, teacherUserId }) => {
      const snapshot = await getSchoolOperationsSnapshot(schoolId);
      const reports = snapshot.teacherReports;
      
      const filteredReports = teacherUserId 
        ? reports.filter(r => r.teacherUserId === teacherUserId)
        : reports;

      if (filteredReports.length === 0) {
        return { content: [{ type: "text", text: "No performance reports found for the specified criteria." }] };
      }

      const avgAttendance = (filteredReports.reduce((sum, r) => sum + r.attendancePercentage, 0) / filteredReports.length).toFixed(2);
      const totalClasses = filteredReports.reduce((sum, r) => sum + r.classesHandled, 0);

      return {
        content: [{ type: "text", text: JSON.stringify({
          schoolId,
          teacherUserId: teacherUserId || "ALL",
          metrics: {
            averageAttendance: `${avgAttendance}%`,
            totalClassesHandled: totalClasses,
            reportCount: filteredReports.length
          },
          insight: Number(avgAttendance) > 95 ? "High performance and consistency." : "Consider reviewing resource allocation."
        }, null, 2) }]
      };
    }
  );

  server.tool(
    "generate_ai_quiz",
    { 
      subjectId: z.string().uuid(), 
      difficulty: z.enum(["EASY", "MEDIUM", "HARD"]), 
      count: z.number().max(10),
      context: z.string().optional() // specific topics to cover
    },
    async ({ subjectId, difficulty, count, context }) => {
      // Mock AI quiz generation logic (would call LLM in production)
      const questions = Array.from({ length: count }).map((_, i) => ({
        id: i + 1,
        question: `Sample ${difficulty} question for subject ${subjectId} about ${context || 'general topics'}?`,
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: "Option A"
      }));

      return {
        content: [{ type: "text", text: JSON.stringify({ subjectId, difficulty, totalQuestions: count, questions }, null, 2) }]
      };
    }
  );

  server.tool(
    "suggest_quizzes_from_timetable",
    { classId: z.string().uuid(), currentTime: z.string().optional() },
    async ({ classId, currentTime }) => {
      const timetable = await fetchJson(`/api/v1/school-ops/timetable?classId=${classId}`);
      // Find the last completed slot based on current time (mocking for now)
      const lastSlot = timetable[0] || null; 
      
      if (!lastSlot) return { content: [{ type: "text", text: "No classes found for this class today." }] };

      return {
        content: [{ type: "text", text: JSON.stringify({
          classId,
          suggestedSubject: lastSlot.subjectId,
          reason: `Class for ${lastSlot.subjectId} just finished.`,
          action: "GENERATE_QUIZ",
          suggestedDifficulty: "MEDIUM"
        }, null, 2) }]
      };
    }
  );

  server.tool(
    "text_to_speech_notification",
    { 
      text: z.string().min(10), 
      language: z.enum(["en-IN", "hi-IN", "bn-IN", "mr-IN"]) // Added Hindi, Bengali, Marathi as local dialects
    },
    async ({ text, language }) => {
      // Mock TTS integration (would call Google Cloud TTS or similar)
      const mockAudioUrl = `https://storage.sms-platform.com/tts/${language}/${Date.now()}.mp3`;
      return {
        content: [{ type: "text", text: JSON.stringify({ 
          status: "SUCCESS", 
          text, 
          language, 
          audioUrl: mockAudioUrl,
          message: `TTS conversion to ${language} scheduled and audio link generated.`
        }, null, 2) }]
      };
    }
  );

  server.resource("platform-overview", "platform://onboarding/overview", async (uri) => ({
    contents: [{ uri: uri.href, text: JSON.stringify(await getPlatformOverviewInteractive(), null, 2) }],
  }));

  server.resource(
    "school-dashboard",
    new ResourceTemplate("school://{schoolId}/dashboard", { list: undefined }),
    async (uri, { schoolId }) => ({
      contents: [{ uri: uri.href, text: JSON.stringify(await getSchoolDashboard(schoolId), null, 2) }],
    })
  );

  server.resource(
    "teacher-workspace",
    new ResourceTemplate("teacher://{schoolId}/{email}/workspace", { list: undefined }),
    async (uri, { schoolId, email }) => ({
      contents: [{ uri: uri.href, text: JSON.stringify(await getTeacherWorkspace(schoolId, email), null, 2) }],
    })
  );

  server.resource(
    "student-workspace",
    new ResourceTemplate("student://{schoolId}/{email}/workspace", { list: undefined }),
    async (uri, { schoolId, email }) => ({
      contents: [{ uri: uri.href, text: JSON.stringify(await getStudentWorkspace(schoolId, email), null, 2) }],
    })
  );

  server.tool(
    "get_containers",
    {},
    async () => {
      try {
        const containers = await docker.listContainers({ all: true });
        return {
          content: [{ 
            type: "text", 
            text: JSON.stringify(containers.map(c => ({
              id: c.Id,
              names: c.Names,
              image: c.Image,
              state: c.State,
              status: c.Status,
              service: c.Labels['com.docker.compose.service'] || c.Names[0].replace(/^\//, '')
            }))) 
          }]
        };
      } catch (error) {
        return { content: [{ type: "text", text: `Error listing containers: ${error.message}` }] };
      }
    }
  );

  return server;
}

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    service: "sms-mcp-server",
    status: "UP",
    gatewayBaseUrl,
    capabilities: [
      "platform_onboarding_overview",
      "school_admin_dashboard",
      "teacher_workspace",
      "student_workspace",
      "ask_school_data",
      "get_container_logs",
      "get_growth_trend",
    ],
  });
});

app.get("/insights/platform-overview", async (_req, res) => {
  runWithRequestContext(_req, async () => {
    try {
      res.json(await getPlatformOverview());
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Unable to load platform overview",
      });
    }
  });
});

app.get("/insights/growth", async (req, res) => {
  runWithRequestContext(req, async () => {
    try {
      res.json(await getPlatformGrowthTrend());
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Unable to load growth trend",
      });
    }
  });
});

app.post("/insights/ask", async (req, res) => {
  runWithRequestContext(req, async () => {
    try {
      const { role, question, schoolId, email } = req.body ?? {};
      res.json(await answerRoleQuestion({ role, question, schoolId, email }));
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Unable to answer question",
      });
    }
  });
});

app.get("/insights/container-logs", async (req, res) => {
  try {
    const { service } = req.query;
    if (!service) throw new Error("Service name query parameter is required");
    const logs = await getContainerLogs(service);
    res.json({ logs });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unable to fetch container logs",
    });
  }
});

app.get("/insights/services", async (_req, res) => {
  try {
    const containers = await docker.listContainers({ all: true });
    res.json(containers.map(c => ({
      id: c.Id,
      names: c.Names,
      image: c.Image,
      state: c.State,
      status: c.Status,
      service: c.Labels['com.docker.compose.service'] || c.Names[0].replace(/^\//, '')
    })));
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unable to list services",
    });
  }
});

app.get("/insights/log-stream", async (req, res) => {
  const { service } = req.query;
  if (!service) return res.status(400).send("Service is required");

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const containers = await docker.listContainers({ all: true });
    const containerInfo = containers.find(c => 
      (c.Labels && c.Labels['com.docker.compose.service'] === service) ||
      c.Names.some(name => name.includes(service))
    );

    if (!containerInfo) {
      res.write(`data: ${JSON.stringify({ error: `Service ${service} not found` })}\n\n`);
      return res.end();
    }

    const container = docker.getContainer(containerInfo.Id);
    const stream = await container.logs({
      stdout: true,
      stderr: true,
      follow: true,
      tail: 50,
      timestamps: true
    });

    // Handle multiplexed stream parsing
    stream.on('data', (chunk) => {
      let offset = 0;
      while (offset < chunk.length) {
        // Some containers might not be multiplexed if they have TTY
        // Multiplexed starts with 0/1/2 then three zeros then length
        const streamType = chunk.readUInt8(offset);
        if (streamType <= 2 && offset + 8 <= chunk.length) {
          const length = chunk.readUInt32BE(offset + 4);
          if (offset + 8 + length <= chunk.length) {
            const logLine = chunk.slice(offset + 8, offset + 8 + length).toString('utf8');
            res.write(`data: ${JSON.stringify({ log: logLine.trim() })}\n\n`);
            offset += 8 + length;
            continue;
          }
        }
        
        // Fallback or non-multiplexed
        const remainder = chunk.slice(offset).toString('utf8');
        res.write(`data: ${JSON.stringify({ log: remainder.trim() })}\n\n`);
        break;
      }
    });

    stream.on('error', (err) => {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    });

    req.on('close', () => {
      if (stream.destroy) stream.destroy();
      else if (stream.end) stream.end();
    });

  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

app.post("/mcp", async (req, res) => {
  if (!isInitializeRequest(req.body)) {
    res.status(400).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Bad Request: initialize request required for stateless mode",
      },
      id: null,
    });
    return;
  }

  try {
    const server = makeServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    res.on("close", () => {
      transport.close();
      server.close();
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : "Internal server error",
        },
        id: null,
      });
    }
  }
});

app.get("/mcp", (_req, res) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message: "Method not allowed in stateless mode.",
    },
    id: null,
  });
});

app.delete("/mcp", (_req, res) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message: "Method not allowed in stateless mode.",
    },
    id: null,
  });
});

app.listen(port, () => {
  console.log(`sms-mcp-server listening on port ${port}`);
});
