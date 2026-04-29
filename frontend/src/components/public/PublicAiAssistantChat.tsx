import React from 'react';
import { AiAssistantChat } from '../ai/AiAssistantChat';

export function PublicAiAssistantChat() {
  return <AiAssistantChat variant="drawer" accessMode="public" />;
}

export default PublicAiAssistantChat;
