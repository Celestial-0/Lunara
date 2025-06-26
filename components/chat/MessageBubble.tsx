"use client";

import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Volume2, Copy, Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import Markdown from "markdown-to-jsx";
import { Highlight, themes } from "prism-react-renderer";
import type { PrismTheme, Language } from "prism-react-renderer";
import type { Message } from "@/types/types";
import { useTheme } from "@/components/core/ThemeProvider";

function CodeBlockWrapper({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const [copyFeedback, setCopyFeedback] = useState(false);
  const prismTheme: PrismTheme =
    theme === "dark" ? themes.oneDark : themes.oneLight;

  // Ensure pre element is handled correctly
  const pre = React.Children.only(children) as React.ReactElement<{
    children: React.ReactNode;
    className?: string;
  }>;

  // Try to find code element
  const codeElement = React.Children.toArray(pre.props.children).find(
    (child) =>
      React.isValidElement(child) &&
      typeof (child as React.ReactElement<{ className?: string }>).props
        .className === "string"
  ) as
    | React.ReactElement<{ className?: string; children?: React.ReactNode }>
    | undefined;
  
  // Get the content
  const content = codeElement
    ? String(codeElement.props.children || "")
    : String(pre.props.children);

  // Get the language - check both code element and pre element
  const codeClassName = codeElement?.props.className || "";
  const preClassName = pre.props.className || "";
  
  // markdown-to-jsx uses "lang-" prefix for fenced code blocks
  const codeLanguage =
    codeClassName.match(/lang-(\w+)/)?.[1] ||
    codeClassName.match(/language-(\w+)/)?.[1];
  const preLanguage =
    preClassName.match(/lang-(\w+)/)?.[1] ||
    preClassName.match(/language-(\w+)/)?.[1];
  const extractedLanguage = codeLanguage || preLanguage;

  // List of supported languages by Prism
  const supportedLanguages = [
    "javascript",
    "typescript",
    "jsx",
    "tsx",
    "python",
    "java",
    "cpp",
    "c",
    "css",
    "html",
    "json",
    "markdown",
    "bash",
    "sql",
    "php",
    "ruby",
    "go",
    "rust",
    "kotlin",
    "swift",
    "scala",
    "r",
    "matlab",
    "perl",
    "shell",
    "yaml",
    "xml",
    "dockerfile",
    "graphql",
    "scss",
    "less",
    "stylus",
    "text",
  ];

  // Use extracted language if supported, otherwise fall back to 'text'
  let language: Language;
  if (extractedLanguage && supportedLanguages.includes(extractedLanguage)) {
    language = extractedLanguage as Language;
  } else {
    language = "text" as Language;
  }

  // Language display mapping for better readability
  const languageDisplayMap: { [key: string]: string } = {
    javascript: "JavaScript",
    typescript: "TypeScript",
    jsx: "JSX",
    tsx: "TSX",
    python: "Python",
    java: "Java",
    cpp: "C++",
    c: "C",
    css: "CSS",
    html: "HTML",
    json: "JSON",
    markdown: "Markdown",
    bash: "Bash",
    sql: "SQL",
    php: "PHP",
    ruby: "Ruby",
    go: "Go",
    rust: "Rust",
    kotlin: "Kotlin",
    swift: "Swift",
    scala: "Scala",
    r: "R",
    matlab: "MATLAB",
    perl: "Perl",
    shell: "Shell",
    yaml: "YAML",
    xml: "XML",
    dockerfile: "Dockerfile",
    graphql: "GraphQL",
    scss: "SCSS",
    less: "Less",
    stylus: "Stylus",
    text: "Text",
  };

  const displayLanguage = languageDisplayMap[language] || language.toUpperCase();

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(content.trim());
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch (error) {
      console.error("Failed to copy code:", error);
    }
  };

  return (
    <div className="relative group bg-muted rounded-lg m-2 overflow-hidden border">
      {/* Header with language and copy button */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b text-sm">
        <span className="text-muted-foreground font-medium">
          {displayLanguage}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 opacity-60 hover:opacity-100 transition-opacity"
          onClick={handleCopyCode}
        >
          {copyFeedback ? (
            <>
              <Check className="h-3 w-3 mr-1 text-green-500" />
              <span className="text-xs text-green-500">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 mr-1" />
              <span className="text-xs">Copy code</span>
            </>
          )}
        </Button>
      </div>
      
      {/* Code content */}
      <Highlight code={content.trim()} language={language} theme={prismTheme}>
        {({ tokens, getLineProps, getTokenProps }) => (
          <pre className="p-4 overflow-auto text-sm leading-relaxed text-foreground">
            {tokens.map((line, i) => {
              const lineProps = getLineProps({ line });
              return (
                <div key={i} {...lineProps}>
                  {line.map((token, idx) => {
                    const tokenProps = getTokenProps({ token });
                    return <span key={idx} {...tokenProps} />;
                  })}
                </div>
              );
            })}
          </pre>
        )}
      </Highlight>
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
  isMobile?: boolean;
  userAvatar?: string;
  userInitials?: string;
}

export function MessageBubble({
  message,
  isMobile = false,
  userAvatar = "",
  userInitials = "U",
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);
  const handleSpeak = () => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(message.content);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setShowCopyFeedback(true);
      setTimeout(() => setShowCopyFeedback(false), 2000);
    } catch (error) {
      console.error("Failed to copy text:", error);
    }
  };

  return (
    <div
      className={cn(
        "flex gap-3 w-full items-start",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <Avatar
          className={cn(
            "border border-muted",
            isMobile ? "h-6 w-6 md:h-8 md:w-8" : "h-8 w-8 md:h-10 md:w-10"
          )}
        >
          <AvatarImage
            src={
              isUser
                ? userAvatar
                : "https://v8sn4u5d65xaovfn.public.blob.vercel-storage.com/Lunara%20AI%20Icon.PNG"
            }
          />
          <AvatarFallback className="bg-muted">
            {isUser ? (
              userInitials
            ) : (
              <Sparkles className="text-primary w-4 h-4" />
            )}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Message Content */}
      <div
        className={cn(
          "flex flex-col min-w-0 flex-1",
          isUser ? "items-end" : "items-start",
          isMobile
            ? "max-w-[calc(100%-3rem)]"
            : "max-w-[calc(100%-4rem)] md:max-w-[calc(100%-5rem)]"
        )}
      >
        <div
          className={cn(
            "rounded-xl max-w-full break-words border bg-background text-foreground p-3 md:p-4",
            isUser ? "bg-primary/5" : "bg-secondary"
          )}
        >
          <div
            className={cn(
              "leading-relaxed",
              isMobile ? "text-xs md:text-sm" : "text-sm md:text-base"
            )}
          >
            {" "}
            <Markdown
              options={{
                forceBlock: true,
                overrides: {
                  pre: { component: CodeBlockWrapper },
                },
              }}
              className="prose prose-sm md:prose-base max-w-none"
            >
              {message.content}
            </Markdown>
          </div>
        </div>

        {/* Message Actions */}
        <div
          className={cn(
            "flex items-center gap-2 mt-1 text-xs text-muted-foreground",
            isUser ? "flex-row-reverse" : "flex-row"
          )}
        >
          {" "}
          <span>
            {message.createdAt
              ? (typeof message.createdAt === "string"
                  ? new Date(message.createdAt)
                  : message.createdAt instanceof Date
                  ? message.createdAt
                  : new Date(message.createdAt)
                ).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : ""}
          </span>
          {!isUser && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "rounded-lg",
                  isMobile ? "h-5 w-5 md:h-6 md:w-6" : "h-6 w-6 md:h-7 md:w-7"
                )}
                onClick={handleSpeak}
              >
                <Volume2 className={cn(isMobile ? "h-3 w-3" : "h-4 w-4")} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "rounded-lg",
                  isMobile ? "h-5 w-5 md:h-6 md:w-6" : "h-6 w-6 md:h-7 md:w-7"
                )}
                onClick={handleCopy}
              >
                {showCopyFeedback ? (
                  <Check
                    className={cn(
                      isMobile ? "h-3 w-3" : "h-4 w-4",
                      "text-green-500"
                    )}
                  />
                ) : (
                  <Copy className={cn(isMobile ? "h-3 w-3" : "h-4 w-4")} />
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
