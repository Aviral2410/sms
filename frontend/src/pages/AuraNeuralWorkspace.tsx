import React from 'react';
import { AiAssistantChat } from '../components/ai/AiAssistantChat';

type AuraNeuralWorkspaceProps = {
  accessMode?: 'authenticated' | 'public';
};

export default function AuraNeuralWorkspace({ accessMode = 'authenticated' }: AuraNeuralWorkspaceProps) {
  return <AiAssistantChat variant="page" accessMode={accessMode} />;
}
