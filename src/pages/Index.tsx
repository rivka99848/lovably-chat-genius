
import React from 'react';
import SimplifiedChatInterface from '@/components/SimplifiedChatInterface';

const Index = () => {
  // Replace old ChatInterface with SimplifiedChatInterface
  return (
    <div className="h-screen overflow-hidden">
      <SimplifiedChatInterface />
    </div>
  );
};

export default Index;
