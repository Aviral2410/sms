package com.sms.aiinteraction.service;

import com.sms.aiinteraction.tool.AiTool;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

@Component
public class ToolRegistry {
    private final Map<String, AiTool> toolsByName;

    public ToolRegistry(List<AiTool> tools) {
        this.toolsByName = tools.stream()
                .collect(Collectors.toMap(AiTool::name, Function.identity()));
    }

    public Optional<AiTool> find(String toolName) {
        return Optional.ofNullable(toolsByName.get(toolName));
    }

    public List<AiTool> all() {
        return List.copyOf(toolsByName.values());
    }
}
