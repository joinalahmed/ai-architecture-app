
"use client";

import type { FormEvent } from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import mermaid from 'mermaid';
import { refineArchitectureDesign, type RefineArchitectureDesignInput, type RefineArchitectureDesignOutput } from "@/ai/flows/refine-architecture-design";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, MessageSquare, FileText, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  explanation?: string;
}

export function ArchitectureRefinementPage() {
  const [projectDescription, setProjectDescription] = useState<string>("");
  const [initialArchitecture, setInitialArchitecture] = useState<string>("");
  const [currentArchitecture, setCurrentArchitecture] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showVisualization, setShowVisualization] = useState<boolean>(false);
  const [mermaidDiagram, setMermaidDiagram] = useState<string>("");
  const { toast } = useToast();
  const mermaidContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'loose',
      theme: 'neutral',
    });
  }, []);

  const generateMermaidDiagram = useCallback((architectureText: string): string => {
    if (!architectureText?.trim()) return "";

    const sanitizeNodeId = (text: string) => text.replace(/[^a-zA-Z0-9_]/g, '_') || 'node';
    const sanitizeNodeText = (text: string) => {
      return text.replace(/"/g, '&quot;').replace(/#/g, '&num;');
    };

    const components = architectureText.split(/,|\n/)
                                   .map(line => line.trim())
                                   .filter(Boolean);
    
    if (components.length === 0) return "";

    let mermaidString = `graph LR\n`;
    const nodeIds: string[] = [];

    components.forEach((component, index) => {
      const baseId = sanitizeNodeId(component);
      const uniqueId = `${baseId}_${index}`; 
      nodeIds.push(uniqueId);
      mermaidString += `  ${uniqueId}["${sanitizeNodeText(component)}"]:::card\n`;
    });

    // Add connections between sequential components
    for (let i = 0; i < nodeIds.length - 1; i++) {
      mermaidString += `  ${nodeIds[i]} --> ${nodeIds[i + 1]}\n`;
    }

    mermaidString += `
  classDef card fill:hsl(var(--card)),stroke:hsl(var(--border)),color:hsl(var(--card-foreground)),stroke-width:1.5px,rx:var(--radius),ry:var(--radius),font-weight:500,padding:10px 15px;
  linkStyle default stroke:hsl(var(--foreground)),stroke-width:1.5px;
`;
    return mermaidString;
  }, []);


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
    setMessages([]);
    setCurrentArchitecture("");
    setMermaidDiagram(""); 

    const baseArchitecture = initialArchitecture.trim() || "Frontend, Backend API, Database";
    
    try {
      const input: RefineArchitectureDesignInput = {
        projectDescription,
        initialArchitectureDesign: baseArchitecture,
      };
      const result = await refineArchitectureDesign(input);
      
      setCurrentArchitecture(result.refinedArchitectureDesign);
      const mermaidDef = generateMermaidDiagram(result.refinedArchitectureDesign);
      setMermaidDiagram(mermaidDef);

      setMessages([
        { id: Date.now().toString(), text: `Based on your project description, here's an initial refined architecture: \n\n${result.refinedArchitectureDesign}`, sender: "ai", explanation: result.explanation },
      ]);
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
      const input: RefineArchitectureDesignInput = {
        projectDescription: `${projectDescription}\n\nUser feedback/request: ${chatInput}`,
        initialArchitectureDesign: currentArchitecture,
      };
      const result = await refineArchitectureDesign(input);
      
      setMessages(prev => [...prev, { id: (Date.now()+1).toString(), text: result.refinedArchitectureDesign, sender: "ai", explanation: result.explanation }]);
      setCurrentArchitecture(result.refinedArchitectureDesign);
      const mermaidDef = generateMermaidDiagram(result.refinedArchitectureDesign);
      setMermaidDiagram(mermaidDef);

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

  useEffect(() => {
    if (mermaidDiagram && mermaidContainerRef.current) {
      const renderMermaid = async () => {
        try {
          mermaidContainerRef.current!.innerHTML = '';
          const { svg } = await mermaid.render(`mermaid-graph-${Date.now()}`, mermaidDiagram); // Use unique ID for each render
          if (mermaidContainerRef.current) {
            mermaidContainerRef.current.innerHTML = svg;
          }
        } catch (e: any) {
          console.error("Error rendering mermaid diagram:", e.message);
          if (mermaidContainerRef.current) {
            mermaidContainerRef.current.innerHTML = `<p class="text-destructive-foreground">Error rendering diagram: ${e.message}</p><pre class="text-xs whitespace-pre-wrap">${mermaidDiagram}</pre>`;
          }
           toast({
            title: "Diagram Error",
            description: "Could not render the architecture diagram. The AI might have provided an incompatible format.",
            variant: "destructive",
          });
        }
      };

      renderMermaid();
    } else if (!mermaidDiagram && mermaidContainerRef.current) {
      mermaidContainerRef.current.innerHTML = ''; 
    }
  }, [mermaidDiagram, toast]); // Added toast to dependency array as it's used inside


  return (
    <div className="flex flex-col md:flex-row h-screen bg-background text-foreground p-4 md:p-6 lg:p-8 gap-4 md:gap-6 lg:gap-8">
      {/* Combined Left Panel: Project Description & Chat */}
      <div className="w-full md:w-1/2 flex flex-col gap-4 md:gap-6 lg:gap-8">
        {/* Project Description Card */}
        <Card className="shadow-xl flex flex-col">
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
                  className="min-h-[150px] flex-grow resize-none bg-card border-border focus:ring-primary"
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
                  className="min-h-[100px] resize-none bg-card border-border focus:ring-primary"
                />
              </div>
              <Button type="submit" disabled={isLoading && !currentArchitecture} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                {isLoading && !messages.length ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                Generate Initial Design
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Chat Interface Card */}
        <Card className="shadow-xl flex flex-col flex-grow bg-card rounded-lg min-h-[300px] md:min-h-0">
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
                      className={`rounded-lg p-3 shadow ${
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
                      <div className="rounded-lg p-3 bg-secondary text-secondary-foreground shadow">
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
                className="flex-grow bg-card border-border focus:ring-primary"
                disabled={!currentArchitecture || isLoading}
              />
              <Button type="submit" size="icon" disabled={!currentArchitecture || isLoading || !chatInput.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Send className="h-4 w-4" />
                <span className="sr-only">Send</span>
              </Button>
            </form>
          </CardFooter>
        </Card>
      </div>

      {/* Right Panel: Architecture Visualization */}
      <Card className="w-full md:w-1/2 flex flex-col shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold flex items-center">
            <FileText className="mr-2 h-6 w-6 text-primary" /> Architecture Diagram
          </CardTitle>
          <CardDescription>Visual representation of the current architecture. Nodes are draggable.</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow p-4 overflow-auto bg-secondary/20 rounded-b-lg">
          <AnimatePresence>
            {showVisualization && currentArchitecture && (
               <motion.div
                  key="mermaid-container"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="h-full w-full border border-dashed border-border rounded-lg p-2 sm:p-4 flex items-center justify-center bg-card"
                >
                  <div ref={mermaidContainerRef} id="mermaid-diagram-container" className="w-full h-full min-h-[300px]">
                    {/* Mermaid diagram will be rendered here by useEffect */}
                  </div>
              </motion.div>
            )}
          </AnimatePresence>
           {!showVisualization && !currentArchitecture && (
             <div className="h-full w-full border border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center bg-card">
                <Image src="https://picsum.photos/seed/initial-arch-placeholder/200/150" alt="Initial state placeholder" width={200} height={150} className="mx-auto mb-4 rounded-md shadow-md" data-ai-hint="blueprint puzzle" />
                <p className="font-semibold text-muted-foreground">Your architecture diagram will appear here.</p>
                <p className="text-sm text-muted-foreground">Start by describing your project on the left.</p>
             </div>
           )}
        </CardContent>
         <CardFooter className="text-xs text-muted-foreground p-4 border-t">
            Note: Visualization is a dynamic representation. Diagram generated using Mermaid.
          </CardFooter>
      </Card>
    </div>
  );
}

