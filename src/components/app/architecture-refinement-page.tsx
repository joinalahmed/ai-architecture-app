"use client";

import { useState, useEffect, FormEvent } from "react";
import { refineArchitectureDesign, RefineArchitectureDesignInput, RefineArchitectureDesignOutput } from "@/ai/flows/refine-architecture-design";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, MessageSquare, FileText, Zap, Users, Database, Server, Shield, Cloud, Share2, Settings, Code } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  explanation?: string;
}

const iconMapping: { [key: string]: React.ElementType } = {
  user: Users,
  database: Database,
  server: Server,
  security: Shield,
  cloud: Cloud,
  api: Share2,
  service: Settings,
  module: Code,
  default: FileText,
};

const getIconForComponent = (componentName: string) => {
  const lowerName = componentName.toLowerCase();
  for (const key in iconMapping) {
    if (lowerName.includes(key)) {
      return iconMapping[key];
    }
  }
  return iconMapping.default;
};


export function ArchitectureRefinementPage() {
  const [projectDescription, setProjectDescription] = useState<string>("");
  const [initialArchitecture, setInitialArchitecture] = useState<string>("");
  const [currentArchitecture, setCurrentArchitecture] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showVisualization, setShowVisualization] = useState<boolean>(false);
  const { toast } = useToast();

  const handleInitialSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!projectDescription.trim()) {
      toast({
        title: "Error",
        description: "Please provide a project description.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    setMessages([]); // Clear previous chat
    setCurrentArchitecture(""); // Clear previous architecture

    // For demo purposes, we'll use a placeholder initial architecture if none is provided.
    const baseArchitecture = initialArchitecture.trim() || "A simple web application with a frontend, a backend API, and a database.";
    setCurrentArchitecture(baseArchitecture);

    try {
      const input: RefineArchitectureDesignInput = {
        projectDescription,
        initialArchitectureDesign: baseArchitecture,
      };
      const result = await refineArchitectureDesign(input);
      
      setMessages([
        { id: Date.now().toString(), text: `Based on your project description, here's an initial refined architecture: \n\n${result.refinedArchitectureDesign}`, sender: "ai", explanation: result.explanation },
      ]);
      setCurrentArchitecture(result.refinedArchitectureDesign);
      setShowVisualization(true);
    } catch (error) {
      console.error("Error refining architecture:", error);
      toast({
        title: "AI Error",
        description: "Failed to refine architecture. Please try again.",
        variant: "destructive",
      });
       setMessages([
        { id: Date.now().toString(), text: "I encountered an error trying to process your request. Please try again.", sender: "ai"},
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !currentArchitecture.trim()) return;

    const newUserMessage: Message = { id: Date.now().toString(), text: chatInput, sender: "user" };
    setMessages(prev => [...prev, newUserMessage]);
    setChatInput("");
    setIsLoading(true);

    try {
      // The AI flow expects projectDescription and initialArchitectureDesign.
      // For chat, we can use the currentArchitecture as the "initial" design to refine further.
      // The project description remains the same. The user's chat input can be appended to the project description
      // or treated as a specific instruction. For simplicity here, we'll treat user's chat as a new refinement instruction for current architecture.
      const input: RefineArchitectureDesignInput = {
        projectDescription: `${projectDescription}\n\nUser feedback/request: ${chatInput}`,
        initialArchitectureDesign: currentArchitecture,
      };
      const result = await refineArchitectureDesign(input);
      
      setMessages(prev => [...prev, { id: (Date.now()+1).toString(), text: result.refinedArchitectureDesign, sender: "ai", explanation: result.explanation }]);
      setCurrentArchitecture(result.refinedArchitectureDesign);
    } catch (error) {
      console.error("Error in chat refinement:", error);
      toast({
        title: "AI Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
      setMessages(prev => [...prev, { id: (Date.now()+1).toString(), text: "Sorry, I couldn't process that. Please try again.", sender: "ai"}]);
    } finally {
      setIsLoading(false);
    }
  };

  // Basic parsing for visualization. This would be much more complex for a real app.
  const parseArchitecture = (architectureText: string): { name: string; Icon: React.ElementType }[] => {
    if (!architectureText) return [];
    // This is a very naive parser. A real implementation would use a structured format (e.g., JSON, YAML) or more robust NLP.
    return architectureText.split(/,|\n/).map(line => line.trim()).filter(Boolean).map(component => {
      const name = component.replace(/^(A |An |The )/i, '').split(' with ')[0].trim(); // Basic cleaning
      return { name, Icon: getIconForComponent(name) };
    });
  };
  
  const architectureComponents = parseArchitecture(currentArchitecture);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background text-foreground p-4 md:p-6 lg:p-8 gap-4 md:gap-6 lg:gap-8">
      {/* Left Panel: Project Description & Initial Architecture */}
      <Card className="w-full md:w-1/3 flex flex-col shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold flex items-center">
            <Zap className="mr-2 h-6 w-6 text-primary" /> Project Details
          </CardTitle>
          <CardDescription>Describe your project and optionally provide an initial architecture idea.</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col gap-4">
          <form onSubmit={handleInitialSubmit} className="flex flex-col gap-4 flex-grow">
            <div className="flex flex-col gap-2 flex-grow">
              <label htmlFor="projectDescription" className="font-medium">Project Description</label>
              <Textarea
                id="projectDescription"
                placeholder="e.g., A social media platform for pet owners..."
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                className="min-h-[150px] flex-grow resize-none bg-white dark:bg-gray-800 border-border focus:ring-primary"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="initialArchitecture" className="font-medium">Initial Architecture (Optional)</label>
              <Textarea
                id="initialArchitecture"
                placeholder="e.g., Frontend (React), Backend (Node.js/Express), Database (PostgreSQL)..."
                value={initialArchitecture}
                onChange={(e) => setInitialArchitecture(e.target.value)}
                className="min-h-[100px] resize-none bg-white dark:bg-gray-800 border-border focus:ring-primary"
              />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
              Generate Initial Design
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Middle Panel: Chat Interface */}
      <div className="w-full md:w-1/3 flex flex-col shadow-xl bg-card rounded-lg">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-2xl font-semibold flex items-center">
            <MessageSquare className="mr-2 h-6 w-6 text-primary" /> Refinement Chat
          </CardTitle>
          <CardDescription>Discuss and iterate on the architecture design with AI.</CardDescription>
        </CardHeader>
        <ScrollArea className="flex-grow p-4">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className={`flex mb-4 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex items-end gap-2 max-w-[80%]`}>
                  {msg.sender === 'ai' && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="https://picsum.photos/seed/ai-avatar/40/40" alt="AI Avatar" data-ai-hint="robot face" />
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`rounded-lg p-3 ${
                      msg.sender === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                    {msg.sender === "ai" && msg.explanation && (
                       <details className="mt-2">
                         <summary className="text-xs text-muted-foreground cursor-pointer hover:underline">Explanation</summary>
                         <p className="text-xs text-muted-foreground mt-1 italic">{msg.explanation}</p>
                       </details>
                    )}
                  </div>
                   {msg.sender === 'user' && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="https://picsum.photos/seed/user-avatar/40/40" alt="User Avatar" data-ai-hint="person silhouette" />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && messages.length > 0 && messages[messages.length-1].sender === 'user' && (
             <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start mb-4"
              >
                <div className="flex items-end gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="https://picsum.photos/seed/ai-avatar/40/40" alt="AI Avatar" data-ai-hint="robot face" />
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                    <div className="rounded-lg p-3 bg-secondary text-secondary-foreground">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                </div>
            </motion.div>
          )}
        </ScrollArea>
        <CardFooter className="p-4 border-t border-border">
          <form onSubmit={handleChatSubmit} className="flex w-full items-center gap-2">
            <Input
              type="text"
              placeholder={currentArchitecture ? "Suggest changes or ask questions..." : "Generate initial design first"}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-grow bg-white dark:bg-gray-800 border-border focus:ring-primary"
              disabled={!currentArchitecture || isLoading}
            />
            <Button type="submit" size="icon" disabled={!currentArchitecture || isLoading || !chatInput.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Send className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </CardFooter>
      </div>

      {/* Right Panel: Architecture Visualization */}
      <Card className="w-full md:w-1/3 flex flex-col shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold flex items-center">
            <FileText className="mr-2 h-6 w-6 text-primary" /> Architecture Diagram
          </CardTitle>
          <CardDescription>Visual representation of the current architecture.</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow p-4 overflow-hidden">
          <AnimatePresence>
            {showVisualization && currentArchitecture && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="h-full w-full border border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center bg-secondary/50"
              >
                {architectureComponents.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full">
                    {architectureComponents.map((component, index) => (
                      <motion.div
                        key={`${component.name}-${index}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.3 }}
                        className="flex flex-col items-center p-3 bg-card rounded-md shadow-md aspect-square justify-center"
                      >
                        <component.Icon className="h-10 w-10 text-primary mb-2" />
                        <p className="text-xs text-center font-medium text-foreground truncate w-full">{component.name}</p>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Image src="https://picsum.photos/seed/empty-arch/200/150" alt="Empty state" width={200} height={150} className="mx-auto mb-4 rounded-md" data-ai-hint="blueprint empty" />
                    <p className="font-semibold">No architecture to display.</p>
                    <p className="text-sm">Generate an initial design or refine the current one.</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
           {!showVisualization && (
             <div className="h-full w-full border border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center bg-secondary/50">
                <Image src="https://picsum.photos/seed/initial-arch/200/150" alt="Initial state" width={200} height={150} className="mx-auto mb-4 rounded-md" data-ai-hint="blueprint puzzle" />
                <p className="font-semibold text-muted-foreground">Your architecture diagram will appear here.</p>
                <p className="text-sm text-muted-foreground">Start by describing your project.</p>
             </div>
           )}
        </CardContent>
         <CardFooter className="text-xs text-muted-foreground p-4">
            Note: Visualization is a simplified representation.
          </CardFooter>
      </Card>
    </div>
  );
}
