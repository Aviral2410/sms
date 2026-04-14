import React from 'react';
import AnnouncementFeed from '../../components/communication/AnnouncementFeed';
import { PortalPageHeader, PortalSection } from '../../components/portal/PortalPagePrimitives';

export default function StudentAssemblyUpdatesPage() {
  return (
    <div className="space-y-6 pb-16">
      <PortalPageHeader
        eyebrow="Assembly updates"
        title="Daily highlights and school notices"
        description="Assembly updates now have a dedicated student-facing page instead of being buried only inside the dashboard."
      />

      <PortalSection title="Latest updates" description="Announcements and notices are filtered for the student audience and kept lightweight for mobile scanning.">
        <AnnouncementFeed role="STUDENT" title="Assembly and notice feed" limit={12} />
      </PortalSection>
    </div>
  );
}
