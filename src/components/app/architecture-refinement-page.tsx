
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
import { Loader2, Send, MessageSquare, FileText, Zap, Database, Cloud, Server, Laptop } from "lucide-react";
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
      theme: 'neutral', // 'neutral' uses CSS variables for theming
       fontFamily: 'Inter, sans-serif', // Match with global font
       mermaid: {
        themeVariables: {
            // These are examples; you might need to adjust based on your globals.css
            // For a more dynamic approach, consider injecting these from CSS variables directly
            // if mermaid's theming allows for it in a more advanced setup.
            primaryColor: 'hsl(var(--primary))', // Primary color for nodes/borders
            primaryTextColor: 'hsl(var(--primary-foreground))', // Text color for primary elements
            lineColor: 'hsl(var(--foreground))', // Arrow/link color
            textColor: 'hsl(var(--foreground))', // Default text color
            mainBkg: 'hsl(var(--card))', // Node background
            nodeBorder: 'hsl(var(--border))', // Node border
            // Add other mermaid theme variables as needed
        }
      }
    });
  }, []);

  const generateMermaidDiagram = useCallback((architectureText: string): string => {
    if (!architectureText?.trim()) return "";

    const sanitizeNodeId = (text: string) => text.replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 50) || 'node';
    const sanitizeNodeText = (text: string) => {
      // Escape mermaid specific characters and quotes
      return text
        .replace(/"/g, '&quot;')
        .replace(/#/g, '&num;')
        .replace(/\(/g, '&lpar;')
        .replace(/\)/g, '&rpar;')
        .replace(/;/g, '&semi;')
        .replace(/:/g, '&colon;');
    };

    const components = architectureText.split(/,|\n/)
                                   .map(line => line.trim())
                                   .filter(Boolean);
    
    if (components.length === 0) return "";

    let mermaidString = `graph TD\n`; // TD for TopDown, LR for LeftRight
    const nodeIds: { id: string, text: string, type: string }[] = [];

    const componentTypeKeywords: Record<string, string> = {
      frontend: "frontend",
      ui: "frontend",
      "user interface": "frontend",
      react: "frontend",
      vue: "frontend",
      angular: "frontend",
      nextjs: "frontend",
      web: "frontend",
      mobile: "frontend",
      app: "frontend",
      client: "frontend",
      
      backend: "server",
      api: "server",
      service: "server",
      microservice: "server",
      server: "server",
      "node.js": "server",
      python: "server",
      java: "server",
      go: "server",
      
      database: "database",
      db: "database",
      storage: "database",
      sql: "database",
      nosql: "database",
      mongodb: "database",
      postgresql: "database",
      mysql: "database",
      redis: "database",
      
      gateway: "gateway",
      "api gateway": "gateway",

      cache: "cache",

      queue: "queue",
      "message queue": "queue",
      kafka: "queue",
      rabbitmq: "queue",
      
      auth: "auth",
      authentication: "auth",
      identity: "auth",

      cdn: "cdn",
      "content delivery network": "cdn",

      "load balancer": "loadbalancer",
      lb: "loadbalancer",

      external: "external",
      "third party": "external",
      "3rd party": "external",
    };

    const getComponentType = (componentText: string): string => {
      const lowerText = componentText.toLowerCase();
      for (const keyword in componentTypeKeywords) {
        if (lowerText.includes(keyword)) {
          return componentTypeKeywords[keyword];
        }
      }
      return "default"; // Default type if no keyword matches
    };
    
    components.forEach((component, index) => {
      const baseId = sanitizeNodeId(component);
      // Ensure unique IDs even if sanitized IDs are the same
      const uniqueId = `${baseId}_${index}`; 
      const componentType = getComponentType(component);
      nodeIds.push({ id: uniqueId, text: component, type: componentType });

      // Different shapes for different component types
      // Using text as label, and sanitized text for quotes issue
      const labelText = sanitizeNodeText(component);
      switch (componentType) {
        case "database":
          mermaidString += `  ${uniqueId}[("${labelText}")];;;\n`; // Cylinder shape
          mermaidString += `  style ${uniqueId} fill:hsl(var(--card)),stroke:hsl(var(--accent)),stroke-width:2px,color:hsl(var(--card-foreground)),rx:5,ry:5\n`;
          break;
        case "server":
          mermaidString += `  ${uniqueId}["${labelText}"];;;\n`; // Rectangle (default, but styled)
           mermaidString += `  style ${uniqueId} fill:hsl(var(--card)),stroke:hsl(var(--primary)),stroke-width:2px,color:hsl(var(--card-foreground)),rx:var(--radius),ry:var(--radius)\n`;
          break;
        case "frontend":
           mermaidString += `  ${uniqueId}["${labelText}"];;;\n`; // Rectangle
           mermaidString += `  style ${uniqueId} fill:hsl(var(--secondary)),stroke:hsl(var(--primary)),stroke-width:2px,color:hsl(var(--secondary-foreground)),rx:var(--radius),ry:var(--radius)\n`;
          break;
        case "gateway":
          mermaidString += `  ${uniqueId}{"${labelText}"};;;\n`; // Rhombus
          mermaidString += `  style ${uniqueId} fill:hsl(var(--card)),stroke:hsl(var(--accent)),stroke-width:2px,color:hsl(var(--card-foreground))\n`;
          break;
        case "external":
           mermaidString += `  ${uniqueId}[("${labelText}")];;;\n`; // Rounded rectangle
           mermaidString += `  style ${uniqueId} fill:hsl(var(--muted)),stroke:hsl(var(--border)),stroke-width:2px,color:hsl(var(--muted-foreground)),rx:var(--radius),ry:var(--radius)\n`;
          break;
        default:
          mermaidString += `  ${uniqueId}["${labelText}"];;;\n`; // Default rectangle
          mermaidString += `  style ${uniqueId} fill:hsl(var(--card)),stroke:hsl(var(--border)),stroke-width:2px,color:hsl(var(--card-foreground)),rx:var(--radius),ry:var(--radius)\n`;
      }
    });

    // Default sequential connections (can be improved if AI provides relations)
    for (let i = 0; i < nodeIds.length - 1; i++) {
        // Simple heuristic: if a frontend connects to a backend/gateway, or backend to database, make it more prominent
        const fromType = nodeIds[i].type;
        const toType = nodeIds[i+1].type;

        if ((fromType === "frontend" && (toType === "server" || toType === "gateway")) ||
            (fromType === "server" && toType === "database") ||
            (fromType === "gateway" && toType === "server")) {
             mermaidString += `  ${nodeIds[i].id} ==> ${nodeIds[i+1].id}\n`; // Thicker arrow
        } else {
            mermaidString += `  ${nodeIds[i].id} --> ${nodeIds[i+1].id}\n`;
        }
    }

    // General styling for links and classes
    mermaidString += `
  classDef default fill:hsl(var(--card)),stroke:hsl(var(--border)),color:hsl(var(--card-foreground)),stroke-width:1.5px,rx:var(--radius),ry:var(--radius),font-weight:500,padding:12px 18px,font-size:14px;
  classDef databaseNode fill:hsl(var(--accent)),stroke:hsl(var(--accent-foreground)),color:hsl(var(--accent-foreground)),stroke-width:2px,rx:20px,ry:20px;
  classDef serverNode fill:hsl(var(--primary)),stroke:hsl(var(--primary-foreground)),color:hsl(var(--primary-foreground)),stroke-width:2px;
  
  linkStyle default stroke:hsl(var(--foreground)),stroke-width:2px,color:hsl(var(--foreground));
  linkStyle thick stroke:hsl(var(--primary)),stroke-width:3px,color:hsl(var(--primary));
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

    const baseArchitecture = initialArchitecture.trim() || "Frontend (React), API Gateway (Node.js), User Service (Node.js), Product Service (Node.js), Main Database (PostgreSQL)";
    
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
        projectDescription: `${projectDescription}\n\nUser feedback/request on current architecture: ${chatInput}`,
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
          // Ensure container is clean and ready
          mermaidContainerRef.current!.innerHTML = '<div class="mermaid-render-placeholder flex items-center justify-center h-full w-full text-muted-foreground"><Loader2 class="h-8 w-8 animate-spin text-primary" /> Rendering Diagram...</div>';
          
          // It's crucial that the ID passed to mermaid.render is unique for each render,
          // especially if re-rendering the same diagram definition after changes.
          const uniqueRenderId = `mermaid-graph-${Date.now()}`;
          const { svg, bindFunctions } = await mermaid.render(uniqueRenderId, mermaidDiagram);
          
          if (mermaidContainerRef.current) {
            mermaidContainerRef.current.innerHTML = svg;
            if (bindFunctions) {
               bindFunctions(mermaidContainerRef.current); // For interactivity if any
            }
            // Try to make SVG responsive
            const svgElement = mermaidContainerRef.current.querySelector('svg');
            if (svgElement) {
              svgElement.setAttribute('width', '100%');
              svgElement.setAttribute('height', '100%');
              svgElement.style.maxWidth = '100%'; // Ensure it doesn't overflow container
              svgElement.style.maxHeight = 'calc(100vh - 200px)'; // Example constraint
            }
          }
        } catch (e: any) {
          console.error("Error rendering mermaid diagram:", e.message, "\nDiagram Definition:\n", mermaidDiagram);
          if (mermaidContainerRef.current) {
            mermaidContainerRef.current.innerHTML = `<div class="p-4 text-sm bg-destructive/10 text-destructive-foreground border border-destructive rounded-md">
              <p class="font-semibold">Error rendering diagram:</p>
              <p class="mt-1 mb-2 text-xs">${e.message}</p>
              <p class="font-semibold mt-2">Diagram Code (for debugging):</p>
              <pre class="mt-1 text-xs whitespace-pre-wrap bg-background/50 p-2 rounded max-h-60 overflow-auto">${mermaidDiagram}</pre>
            </div>`;
          }
           toast({
            title: "Diagram Render Error",
            description: "Could not render the architecture diagram. The AI might have provided an incompatible format or there was an issue with the renderer.",
            variant: "destructive",
            duration: 8000,
          });
        }
      };

      // Debounce or delay rendering slightly if diagram changes rapidly
      const timerId = setTimeout(renderMermaid, 100);
      return () => clearTimeout(timerId);

    } else if (!mermaidDiagram && mermaidContainerRef.current) {
      mermaidContainerRef.current.innerHTML = ''; 
    }
  }, [mermaidDiagram, toast]);


  return (
    <div className="flex flex-col md:flex-row h-screen bg-background text-foreground p-4 md:p-6 lg:p-8 gap-4 md:gap-6 lg:gap-8">
      {/* Combined Left Panel: Project Description & Chat */}
      <div className="w-full md:w-1/2 lg:w-2/5 xl:w-1/3 flex flex-col gap-4 md:gap-6 lg:gap-8 max-h-screen overflow-y-auto">
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
                  placeholder="e.g., A social media platform for pet owners with real-time chat, photo sharing, and event planning capabilities. Scalability and security are key concerns."
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  className="min-h-[150px] flex-grow resize-none bg-card border-input focus:ring-primary rounded-md shadow-sm"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="initialArchitecture" className="font-medium">Initial Architecture (Optional)</label>
                <Textarea
                  id="initialArchitecture"
                  placeholder="e.g., Frontend (React), Backend API (Node.js/Express), User Database (PostgreSQL), Chat Service (WebSocket), Image Storage (S3)..."
                  value={initialArchitecture}
                  onChange={(e) => setInitialArchitecture(e.target.value)}
                  className="min-h-[100px] resize-none bg-card border-input focus:ring-primary rounded-md shadow-sm"
                />
              </div>
              <Button type="submit" disabled={isLoading && !currentArchitecture} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-md shadow-md py-3 text-base font-semibold">
                {isLoading && !messages.length ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Zap className="mr-2 h-5 w-5" />}
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
            <CardDescription>Discuss and iterate on the architecture design with the AI.</CardDescription>
          </CardHeader>
          <ScrollArea className="flex-grow p-4" id="chat-scroll-area">
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
                  <div className={`flex items-end gap-2 max-w-[85%]`}>
                    {msg.sender === 'ai' && (
                      <Avatar className="h-8 w-8 self-start shadow-sm">
                        <AvatarImage src="https://picsum.photos/seed/ai-arch/40/40" alt="AI Avatar" data-ai-hint="brain circuit" />
                        <AvatarFallback className="bg-primary text-primary-foreground">AI</AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`rounded-xl p-3 shadow-md ${
                        msg.sender === "user"
                          ? "bg-primary text-primary-foreground rounded-br-none"
                          : "bg-secondary text-secondary-foreground rounded-bl-none"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                      {msg.sender === "ai" && msg.explanation && (
                         <details className="mt-2">
                           <summary className="text-xs text-muted-foreground cursor-pointer hover:underline font-medium">View Explanation</summary>
                           <p className="text-xs text-muted-foreground/80 mt-1 italic bg-muted/50 p-2 rounded-md">{msg.explanation}</p>
                         </details>
                      )}
                    </div>
                     {msg.sender === 'user' && (
                      <Avatar className="h-8 w-8 self-start shadow-sm">
                        <AvatarImage src="https://picsum.photos/seed/usr-avatar/40/40" alt="User Avatar" data-ai-hint="person icon" />
                        <AvatarFallback className="bg-accent text-accent-foreground">U</AvatarFallback>
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
                      <Avatar className="h-8 w-8 self-start shadow-sm">
                        <AvatarImage src="https://picsum.photos/seed/ai-arch/40/40" alt="AI Avatar" data-ai-hint="brain circuit" />
                        <AvatarFallback className="bg-primary text-primary-foreground">AI</AvatarFallback>
                      </Avatar>
                      <div className="rounded-xl p-3 bg-secondary text-secondary-foreground shadow-md rounded-bl-none">
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      </div>
                  </div>
              </motion.div>
            )}
          </ScrollArea>
          <CardFooter className="p-4 border-t border-border bg-background/50 rounded-b-lg">
            <form onSubmit={handleChatSubmit} className="flex w-full items-center gap-3">
              <Input
                type="text"
                placeholder={currentArchitecture ? "e.g., Add a caching layer..." : "Generate initial design first"}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-grow bg-card border-input focus:ring-primary rounded-md shadow-sm text-sm py-2.5"
                disabled={!currentArchitecture || isLoading}
                aria-label="Chat input for architecture refinement"
              />
              <Button type="submit" size="icon" disabled={!currentArchitecture || isLoading || !chatInput.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-md shadow-md w-10 h-10">
                <Send className="h-5 w-5" />
                <span className="sr-only">Send message</span>
              </Button>
            </form>
          </CardFooter>
        </Card>
      </div>

      {/* Right Panel: Architecture Visualization */}
      <Card className="w-full md:w-1/2 lg:w-3/5 xl:w-2/3 flex flex-col shadow-xl max-h-screen">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-2xl font-semibold flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-6 w-6 text-primary"><path d="M12 20V10"/><path d="M5 20V4"/><path d="M19 20V16"/><path d="M5 4h14"/><path d="M12 10h7"/><path d="M5 12h7"/><path d="M5 20h14"/></svg>
             Architecture Diagram
          </CardTitle>
          <CardDescription>Visual representation of the current software architecture. Click and drag nodes to rearrange.</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow p-2 sm:p-4 overflow-auto bg-muted/20 rounded-b-lg flex items-center justify-center">
          <AnimatePresence mode="wait">
            {isLoading && !mermaidDiagram && (
              <motion.div
                key="loading-placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full w-full flex flex-col items-center justify-center text-muted-foreground"
              >
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg font-medium">Generating architecture diagram...</p>
                <p className="text-sm">Please wait a moment.</p>
              </motion.div>
            )}
            {!isLoading && showVisualization && currentArchitecture && mermaidDiagram && (
               <motion.div
                  key="mermaid-container"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3, ease: "circOut" }}
                  className="h-full w-full border border-dashed border-border/50 rounded-lg p-1 sm:p-2 flex items-center justify-center bg-card shadow-inner"
                >
                  <div ref={mermaidContainerRef} id="mermaid-diagram-container" className="w-full h-full min-h-[400px] flex items-center justify-center">
                    {/* Mermaid diagram will be rendered here by useEffect */}
                  </div>
              </motion.div>
            )}
             {!isLoading && (!showVisualization || !currentArchitecture || !mermaidDiagram) && (
             <motion.div
                key="initial-placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full w-full border border-dashed border-border/50 rounded-lg p-6 flex flex-col items-center justify-center bg-card shadow-inner text-center"
              >
                <Image src="https://picsum.photos/seed/arch-blueprint/250/180" alt="Architecture blueprint placeholder" width={250} height={180} className="mx-auto mb-6 rounded-lg shadow-md" data-ai-hint="blueprint puzzle" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Visualize Your Vision</h3>
                <p className="text-base text-muted-foreground max-w-md">
                  Your software architecture diagram will appear here once generated.
                  Start by describing your project details on the left and click "Generate Initial Design".
                </p>
             </motion.div>
           )}
          </AnimatePresence>
        </CardContent>
         <CardFooter className="text-xs text-muted-foreground p-3 border-t border-border bg-background/50 rounded-b-lg">
            Diagram generated using Mermaid.js. Styles are based on your application theme. For complex diagrams, rendering might take a few moments.
          </CardFooter>
      </Card>
    </div>
  );
}

