import React, { useState, useRef, useEffect, useCallback } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useNetwork } from "@/hooks/use-network";
import { useEditorHistory } from "@/hooks/use-editor-history";
import { useToast } from "@/hooks/use-toast";
import { SettingsDialog, AppSettings } from "@/components/SettingsDialog";
import {
  FileText,
  Download,
  Share2,
  Undo2,
  Redo2,
  Scissors,
  Copy,
  ClipboardPaste,
  Bold,
  Italic,
  Strikethrough,
  Code,
  Quote,
  Settings,
  Wifi,
  WifiOff,
  Sun,
  Moon,
  Maximize,
  Minimize,
  ZoomIn,
  TextSelect,
  ImageDown,
  Link,
  CalendarDays,
  BookMarked,
  ExternalLink,
  Menu as MenuIcon,
  MessageSquare,
  Brain,
  Search,
  File
} from "lucide-react";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
  MenubarCheckboxItem,
} from "@/components/ui/menubar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

const DEFAULT_SETTINGS: AppSettings = {
  appBgColor: "#0f172a",
  appBgImage: `${import.meta.env.BASE_URL}images/bg-abstract.png`,
  glassTransparency: 50,
  glassBlur: 30,
  editorBg: "black",
  editorTextColor: "white",
  wordWrap: true,
  zoom: 100,
};

export default function Home() {
  const [text, setText] = useLocalStorage<string>("notepad_content", "");
  const [settings, setSettings] = useLocalStorage<AppSettings>(
    "notepad_settings",
    DEFAULT_SETTINGS,
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [cursorPos, setCursorPos] = useState({ ln: 1, col: 1 });
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [downloadFilename, setDownloadFilename] = useState("untitled");
  const [imageDownloadDialogOpen, setImageDownloadDialogOpen] = useState(false);
  const [imageDownloadFilename, setImageDownloadFilename] =
    useState("Untitled");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [insertLinkOpen, setInsertLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");

  const [insertDateOpen, setInsertDateOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });

  const [linkSummaryOpen, setLinkSummaryOpen] = useState(false);

  const [whatsAppDialogOpen, setWhatsAppDialogOpen] = useState(false);
  const [whatsAppCountryCode, setWhatsAppCountryCode] = useState("1");
  const [whatsAppPhone, setWhatsAppPhone] = useState("");
  const [whatsAppContent, setWhatsAppContent] = useState("");

  const isOnline = useNetwork();
  const { toast } = useToast();
  const isMounted = useRef(false);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    if (isOnline) {
      toast({
        title: "Back online",
        description: "Your internet connection has been restored.",
        duration: 4000,
      });
    } else {
      toast({
        title: "You're offline",
        description: "No internet connection. Your work is saved locally.",
        duration: 6000,
        variant: "destructive",
      });
    }
  }, [isOnline]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { pushState, undo, redo, canUndo, canRedo } = useEditorHistory(text);

  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      pushState(newText);
    }, 1000);
  };

  const handleCursorChange = () => {
    const el = textareaRef.current;
    if (!el) return;
    const linesBeforeCursor = el.value
      .substring(0, el.selectionStart)
      .split("\n");
    setCursorPos({
      ln: linesBeforeCursor.length,
      col: linesBeforeCursor[linesBeforeCursor.length - 1].length + 1,
    });
  };

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const handleUndo = useCallback(() => {
    if (canUndo) {
      const prev = undo();
      setText(prev);
    }
  }, [canUndo, undo, setText]);

  const handleRedo = useCallback(() => {
    if (canRedo) {
      const next = redo();
      setText(next);
    }
  }, [canRedo, redo, setText]);

  const formatSelection = useCallback(
    (prefix: string, suffix: string = prefix) => {
      const el = textareaRef.current;
      if (!el) return;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const selected = text.substring(start, end);
      const before = text.substring(0, start);
      const after = text.substring(end);

      const isWrapped =
        selected.startsWith(prefix) &&
        selected.endsWith(suffix) &&
        selected.length >= prefix.length + suffix.length;

      const alreadyWrapped =
        isWrapped || (before.endsWith(prefix) && after.startsWith(suffix));

      let newText: string;
      let newStart: number;
      let newEnd: number;

      if (alreadyWrapped) {
        if (isWrapped) {
          const inner = selected.slice(
            prefix.length,
            selected.length - suffix.length,
          );
          newText = before + inner + after;
          newStart = start;
          newEnd = start + inner.length;
        } else {
          const strippedBefore = before.slice(0, before.length - prefix.length);
          const strippedAfter = after.slice(suffix.length);
          newText = strippedBefore + selected + strippedAfter;
          newStart = start - prefix.length;
          newEnd = end - prefix.length;
        }
      } else {
        newText = before + prefix + selected + suffix + after;
        newStart =
          selected.length > 0 ? start + prefix.length : start + prefix.length;
        newEnd =
          selected.length > 0 ? end + prefix.length : start + prefix.length;
      }

      setText(newText);
      pushState(newText);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(newStart, newEnd);
      }, 0);
    },
    [text, setText, pushState],
  );

  const handleQuote = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const before = text.substring(0, start);
    const lastNewlineIndex = before.lastIndexOf("\n");
    const lineStart = lastNewlineIndex === -1 ? 0 : lastNewlineIndex + 1;
    const lineContent = text.substring(lineStart);
    const isQuoted = lineContent.startsWith("> ");

    let newText: string;
    let cursorShift: number;

    if (isQuoted) {
      newText = text.substring(0, lineStart) + lineContent.substring(2);
      cursorShift = -2;
    } else {
      newText = text.substring(0, lineStart) + "> " + lineContent;
      cursorShift = 2;
    }

    setText(newText);
    pushState(newText);
    setTimeout(() => {
      el.focus();
      const newPos = Math.max(lineStart, start + cursorShift);
      el.setSelectionRange(newPos, newPos);
    }, 0);
  }, [text, setText, pushState]);

  const handleSelectAll = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(0, el.value.length);
    handleCursorChange();
  }, []);

  const handleCopy = () => {
    const el = textareaRef.current;
    if (!el) return;
    if (el.selectionStart !== el.selectionEnd) {
      const selected = text.substring(el.selectionStart, el.selectionEnd);
      navigator.clipboard.writeText(selected);
      toast({ description: "Copied to clipboard" });
    }
  };

  const handleCut = () => {
    const el = textareaRef.current;
    if (!el) return;
    if (el.selectionStart !== el.selectionEnd) {
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const selected = text.substring(start, end);
      navigator.clipboard.writeText(selected);
      const newText = text.substring(0, start) + text.substring(end);
      setText(newText);
      pushState(newText);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start, start);
      }, 0);
      toast({ description: "Cut to clipboard" });
    }
  };

  const handlePaste = async () => {
    const el = textareaRef.current;
    if (!el) return;
    try {
      const clipboardText = await navigator.clipboard.readText();
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const newText =
        text.substring(0, start) + clipboardText + text.substring(end);
      setText(newText);
      pushState(newText);
      setTimeout(() => {
        el.focus();
        const newCursorPos = start + clipboardText.length;
        el.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    } catch (err) {
      toast({
        title: "Error",
        description: "Could not read from clipboard",
        variant: "destructive",
      });
    }
  };

  const openDownloadDialog = useCallback(() => {
    setDownloadFilename("untitled");
    setDownloadDialogOpen(true);
  }, []);

  const confirmDownload = useCallback(() => {
    const name = downloadFilename.trim() || "untitled";
    const finalName = name.endsWith(".txt") ? name : `${name}.txt`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = finalName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadDialogOpen(false);
    toast({ description: `"${finalName}" downloaded successfully` });
  }, [text, downloadFilename, toast]);

  const insertAtCursor = useCallback(
    (insertText: string) => {
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart ?? text.length;
      const end = ta.selectionEnd ?? start;
      const newText = text.slice(0, start) + insertText + text.slice(end);
      setText(newText);
      requestAnimationFrame(() => {
        ta.focus();
        const pos = start + insertText.length;
        ta.setSelectionRange(pos, pos);
      });
    },
    [text, setText],
  );

  const handleOpenInsertLink = useCallback(() => {
    const ta = textareaRef.current;
    const sel = ta ? text.slice(ta.selectionStart, ta.selectionEnd) : "";
    setLinkLabel(sel || "");
    setLinkUrl("");
    setInsertLinkOpen(true);
  }, [text]);

  const confirmInsertLink = useCallback(() => {
    const url = linkUrl.trim();
    if (!url) return;
    const label = linkLabel.trim();
    insertAtCursor(label ? `[${label}](${url})` : url);
    setInsertLinkOpen(false);
    setLinkUrl("");
    setLinkLabel("");
  }, [linkUrl, linkLabel, insertAtCursor]);

  const handleOpenInsertDate = useCallback(() => {
    setSelectedDate(new Date().toISOString().slice(0, 10));
    setInsertDateOpen(true);
  }, []);

  const confirmInsertDate = useCallback(() => {
    const [year, month, day] = selectedDate.split("-");
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    const formatted = d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    insertAtCursor(formatted);
    setInsertDateOpen(false);
  }, [selectedDate, insertAtCursor]);

  const extractedLinks = React.useMemo(() => {
    const urlRegex = /https?:\/\/[^\s\)\]"'>]+/g;
    const mdLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
    const results: { label: string; url: string }[] = [];
    const seen = new Set<string>();
    let m: RegExpExecArray | null;
    while ((m = mdLinkRegex.exec(text)) !== null) {
      if (!seen.has(m[2])) {
        seen.add(m[2]);
        results.push({ label: m[1], url: m[2] });
      }
    }
    const plainText = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, "");
    while ((m = urlRegex.exec(plainText)) !== null) {
      const url = m[0].replace(/[.,;!?]+$/, "");
      if (!seen.has(url)) {
        seen.add(url);
        results.push({ label: url, url });
      }
    }
    return results;
  }, [text]);

  const handleDownloadAsImage = useCallback(() => {
    setImageDownloadFilename("Untitled");
    setImageDownloadDialogOpen(true);
  }, []);

  const confirmDownloadAsImage = useCallback(() => {
    const name = imageDownloadFilename.trim() || "Untitled";
    const finalName = name.endsWith(".png") ? name : `${name}.png`;

    const lines = text.split("\n");
    const fontSize = Math.round(14 * (settings.zoom / 100));
    const lineHeight = Math.round(fontSize * 1.6);
    const paddingX = 32;
    const paddingY = 24;
    const canvasWidth = 900;
    const canvasHeight = paddingY * 2 + Math.max(lines.length, 1) * lineHeight;

    const canvas = document.createElement("canvas");
    const scale = 2;
    canvas.width = canvasWidth * scale;
    canvas.height = canvasHeight * scale;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(scale, scale);

    const bgColor = settings.editorBg === "black" ? "#000000" : "#ffffff";
    const textColor =
      settings.editorTextColor === "yellow"
        ? "#eab308"
        : settings.editorTextColor === "white"
          ? "#ffffff"
          : "#000000";

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const fontFamily = "'JetBrains Mono', 'Fira Code', Menlo, monospace";
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.fillStyle = textColor;

    const textAreaWidth = canvasWidth - paddingX * 2;

    let drawY = paddingY;
    lines.forEach((line) => {
      if (settings.wordWrap && ctx.measureText(line).width > textAreaWidth) {
        const words = line.split(" ");
        let currentLine = "";
        for (const word of words) {
          const test = currentLine ? currentLine + " " + word : word;
          if (ctx.measureText(test).width > textAreaWidth && currentLine) {
            ctx.fillText(currentLine, paddingX, drawY);
            drawY += lineHeight;
            currentLine = word;
          } else {
            currentLine = test;
          }
        }
        if (currentLine) {
          ctx.fillText(currentLine, paddingX, drawY);
          drawY += lineHeight;
        }
      } else {
        ctx.fillText(line, paddingX, drawY);
        drawY += lineHeight;
      }
    });

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = finalName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setImageDownloadDialogOpen(false);
      toast({ description: `"${finalName}" downloaded successfully` });
    }, "image/png");
  }, [text, settings, imageDownloadFilename, toast]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "text/plain" && !file.name.endsWith(".txt")) {
      toast({
        title: "Invalid file",
        description: "Please upload a .txt file",
        variant: "destructive",
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = (re) => {
      const content = re.target?.result as string;
      setText(content);
      pushState(content);
      toast({ description: "File loaded successfully" });
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleWhatsApp = () => {
    const el = textareaRef.current;
    let contentToShare = text;
    if (el && el.selectionStart !== el.selectionEnd) {
      contentToShare = text.substring(el.selectionStart, el.selectionEnd);
    }
    if (!contentToShare.trim()) {
      toast({ description: "Nothing to share!" });
      return;
    }
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(contentToShare)}`;
    window.open(url, "_blank");
  };
  
  const handleEmail = () => {
    const el = textareaRef.current;
    let contentToShare = text;
    if (el && el.selectionStart !== el.selectionEnd) {
      contentToShare = text.substring(el.selectionStart, el.selectionEnd);
    }
    if (!contentToShare.trim()) {
      toast({ description: "Nothing to share!" });
      return;
    }
    const url = `mailto:/?body=${encodeURIComponent(contentToShare)}&showComposeBox=true`;
    window.open(url, "_blank");
  };
  
  const handleChatGPT = () => {
    const el = textareaRef.current;
    let contentToShare = text;
    if (el && el.selectionStart !== el.selectionEnd) {
      contentToShare = text.substring(el.selectionStart, el.selectionEnd);
    }
    if (!contentToShare.trim()) {
      toast({ description: "Nothing to share!" });
      return;
    }
    const url = `https://chatgpt.com/?prompt=${encodeURIComponent(contentToShare)}`;
    window.open(url, "_blank");
  };
  
  const handleGoogleSearch = () => {
    const el = textareaRef.current;
    let contentToShare = text;
    if (el && el.selectionStart !== el.selectionEnd) {
      contentToShare = text.substring(el.selectionStart, el.selectionEnd);
    }
    if (!contentToShare.trim()) {
      toast({ description: "Nothing to share!" });
      return;
    }
    const url = `https://www.google.com/search?q=${encodeURIComponent(contentToShare)}`;
    window.open(url, "_blank");
  };
  
  const handleBingSearch = () => {
    const el = textareaRef.current;
    let contentToShare = text;
    if (el && el.selectionStart !== el.selectionEnd) {
      contentToShare = text.substring(el.selectionStart, el.selectionEnd);
    }
    if (!contentToShare.trim()) {
      toast({ description: "Nothing to share!" });
      return;
    }
    const url = `https://www.bing.com/search?q=${encodeURIComponent(contentToShare)}`;
    window.open(url, "_blank");
  };
  
  const handleGoogleNewsSearch = () => {
    const el = textareaRef.current;
    let contentToShare = text;
    if (el && el.selectionStart !== el.selectionEnd) {
      contentToShare = text.substring(el.selectionStart, el.selectionEnd);
    }
    if (!contentToShare.trim()) {
      toast({ description: "Nothing to share!" });
      return;
    }
    const url = `https://news.google.com/search?q=${encodeURIComponent(contentToShare)}&hl=en-IN&gl=IN&ceid=IN%3Aen`;
    window.open(url, "_blank");
  };
  
  const handleYouTubeSearch = () => {
    const el = textareaRef.current;
    let contentToShare = text;
    if (el && el.selectionStart !== el.selectionEnd) {
      contentToShare = text.substring(el.selectionStart, el.selectionEnd);
    }
    if (!contentToShare.trim()) {
      toast({ description: "Nothing to share!" });
      return;
    }
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(contentToShare)}`;
    window.open(url, "_blank");
  };
  
  const handleWikipidiaSearch = () => {
    const el = textareaRef.current;
    let contentToShare = text;
    if (el && el.selectionStart !== el.selectionEnd) {
      contentToShare = text.substring(el.selectionStart, el.selectionEnd);
    }
    if (!contentToShare.trim()) {
      toast({ description: "Nothing to share!" });
      return;
    }
    const url = `https://en.wikipedia.org/?search=${encodeURIComponent(contentToShare)}`;
    window.open(url, "_blank");
  };
  
  const handleAIMode = () => {
    const el = textareaRef.current;
    let contentToShare = text;
    if (el && el.selectionStart !== el.selectionEnd) {
      contentToShare = text.substring(el.selectionStart, el.selectionEnd);
    }
    if (!contentToShare.trim()) {
      toast({ description: "Nothing to share!" });
      return;
    }
    const url = `https://www.google.com/search?q=${encodeURIComponent(contentToShare)}&udm=50`;
    window.open(url, "_blank");
  };

  const handleWhatsAppToNumber = () => {
    const el = textareaRef.current;
    let contentToShare = text;
    if (el && el.selectionStart !== el.selectionEnd) {
      contentToShare = text.substring(el.selectionStart, el.selectionEnd);
    }
    if (!contentToShare.trim()) {
      toast({ description: "Nothing to share!" });
      return;
    }
    setWhatsAppContent(contentToShare);
    setWhatsAppPhone("");
    setWhatsAppCountryCode("1");
    setWhatsAppDialogOpen(true);
  };

  const confirmWhatsApp = () => {
    const phone = `${whatsAppCountryCode.replace(/\D/g, "")}${whatsAppPhone.replace(/\D/g, "")}`;
    if (!phone) {
      toast({
        description: "Please enter a phone number.",
        variant: "destructive",
      });
      return;
    }
    const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(whatsAppContent)}`;
    window.open(url, "_blank");
    setWhatsAppDialogOpen(false);
  };

  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        toast({
          description: "Fullscreen not supported in this context",
          variant: "destructive",
        });
      });
    } else {
      document.exitFullscreen();
    }
  }, [toast]);

  const handleNewFile = useCallback(() => {
    setText("");
    pushState("");
    toast({ description: "New file created" });
  }, [setText, pushState, toast])

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "s":
            e.preventDefault();
            openDownloadDialog();
            break;
          case "z":
            e.preventDefault();
            if (e.shiftKey) handleRedo();
            else handleUndo();
            break;
          case "y":
            e.preventDefault();
            handleRedo();
            break;
          case "b":
            e.preventDefault();
            formatSelection("*");
            break;
          case "i":
            e.preventDefault();
            formatSelection("_");
            break;
        }
      }
      if (e.key === "F11") {
        e.preventDefault();
        handleToggleFullscreen();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    openDownloadDialog,
    handleUndo,
    handleRedo,
    formatSelection,
    handleToggleFullscreen,
  ]);

  const glassStyle = {
    backgroundColor: `rgba(255, 255, 255, ${(settings.glassTransparency / 100) * 0.1})`,
    backdropFilter: `blur(${settings.glassBlur}px)`,
    WebkitBackdropFilter: `blur(${settings.glassBlur}px)`,
  };

  const editorStyle = {
    backgroundColor: settings.editorBg === "black" ? "#000000" : "#ffffff",
    color:
      settings.editorTextColor === "yellow"
        ? "#eab308"
        : settings.editorTextColor,
    fontSize: `${settings.zoom}%`,
    whiteSpace: settings.wordWrap ? ("pre-wrap" as const) : ("pre" as const),
  };

  const lineCount = text.split("\n").length;

  return (
    <div
      className="min-h-screen flex flex-col relative transition-colors duration-500"
      style={{
        backgroundColor: settings.appBgColor,
        backgroundImage: settings.appBgImage
          ? `url(${settings.appBgImage})`
          : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUpload}
        accept=".txt"
        className="hidden"
      />

      {/* Menubar */}
      <div
        className="flex items-center px-4 py-2 border-b border-white/10 z-20 shrink-0"
        style={glassStyle}
      >
        <Menubar className="border-none bg-transparent h-auto p-0 space-x-1 overflow-x-auto custom-scrollbar">
          <MenubarMenu>
            <MenubarTrigger className="px-3 py-1.5 cursor-pointer hover:bg-white/10 data-[state=open]:bg-white/20 rounded-md transition-colors text-white font-medium">
              File
            </MenubarTrigger>
            <MenubarContent className="bg-background/95 backdrop-blur-xl border-white/10 text-foreground">
              <MenubarItem onClick={handleNewFile}>
                <File className="w-4 h-4 mr-2" /> New
              </MenubarItem>
              <MenubarItem onClick={() => fileInputRef.current?.click()}>
                <FileText className="w-4 h-4 mr-2" /> Open...
              </MenubarItem>
              <MenubarItem onClick={openDownloadDialog}>
                <Download className="w-4 h-4 mr-2" /> Download
                <MenubarShortcut>⌘S</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onClick={handleDownloadAsImage}>
                <ImageDown className="w-4 h-4 mr-2" /> Download as Image
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger className="px-3 py-1.5 cursor-pointer hover:bg-white/10 data-[state=open]:bg-white/20 rounded-md transition-colors text-white font-medium">
              Edit
            </MenubarTrigger>
            <MenubarContent className="bg-background/95 backdrop-blur-xl border-white/10 text-foreground">
              <MenubarItem onClick={handleUndo} disabled={!canUndo}>
                <Undo2 className="w-4 h-4 mr-2" /> Undo
                <MenubarShortcut>⌘Z</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onClick={handleRedo} disabled={!canRedo}>
                <Redo2 className="w-4 h-4 mr-2" /> Redo
                <MenubarShortcut>⌘Y</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator className="bg-white/10" />
              <MenubarItem onClick={handleCut}>
                <Scissors className="w-4 h-4 mr-2" /> Cut
                <MenubarShortcut>⌘X</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onClick={handleCopy}>
                <Copy className="w-4 h-4 mr-2" /> Copy
                <MenubarShortcut>⌘C</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onClick={handlePaste}>
                <ClipboardPaste className="w-4 h-4 mr-2" /> Paste
                <MenubarShortcut>⌘V</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator className="bg-white/10" />
              <MenubarItem onClick={handleSelectAll}>
                <TextSelect className="w-4 h-4 mr-2" />
                Select All
                <MenubarShortcut>⌘A</MenubarShortcut>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          
          <MenubarMenu>
            <MenubarTrigger className="px-3 py-1.5 cursor-pointer hover:bg-white/10 data-[state=open]:bg-white/20 rounded-md transition-colors text-white font-medium">
              Share
            </MenubarTrigger>
            <MenubarContent className="bg-background/95 backdrop-blur-xl border-white/10 text-foreground">
              <MenubarItem onClick={handleWhatsApp}>
                <Share2 className="w-4 h-4 mr-2" /> WhatsApp
              </MenubarItem>
              <MenubarItem onClick={handleWhatsAppToNumber}>
                <Share2 className="w-4 h-4 mr-2" /> WhatsApp Number
              </MenubarItem>
              <MenubarItem onClick={handleEmail}>
                <Share2 className="w-4 h-4 mr-2" /> Email
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          
          <MenubarMenu>
            <MenubarTrigger className="px-3 py-1.5 cursor-pointer hover:bg-white/10 data-[state=open]:bg-white/20 rounded-md transition-colors text-white font-medium">
              Ask
            </MenubarTrigger>
            <MenubarContent className="bg-background/95 backdrop-blur-xl border-white/10 text-foreground">
              <MenubarItem onClick={handleChatGPT}>
                <Brain className="w-4 h-4 mr-2" /> OpenAI ChatGPT
              </MenubarItem>
              <MenubarItem onClick={handleAIMode}>
                <Brain className="w-4 h-4 mr-2" /> Google AI mode
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          
          <MenubarMenu>
            <MenubarTrigger className="px-3 py-1.5 cursor-pointer hover:bg-white/10 data-[state=open]:bg-white/20 rounded-md transition-colors text-white font-medium">
              Search
            </MenubarTrigger>
            <MenubarContent className="bg-background/95 backdrop-blur-xl border-white/10 text-foreground">
              <MenubarItem onClick={handleGoogleSearch}>
                <Search className="w-4 h-4 mr-2" /> Google
              </MenubarItem>
              <MenubarItem onClick={handleGoogleNewsSearch}>
                <Search className="w-4 h-4 mr-2" /> Google News
              </MenubarItem>
              <MenubarItem onClick={handleWikipidiaSearch}>
                <Search className="w-4 h-4 mr-2" /> Wikipidia
              </MenubarItem>
              <MenubarItem onClick={handleBingSearch}>
                <Search className="w-4 h-4 mr-2" /> Bing
              </MenubarItem>
              <MenubarItem onClick={handleYouTubeSearch}>
                <Search className="w-4 h-4 mr-2" /> YouTube
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger className="px-3 py-1.5 cursor-pointer hover:bg-white/10 data-[state=open]:bg-white/20 rounded-md transition-colors text-white font-medium">
              Insert
            </MenubarTrigger>
            <MenubarContent className="bg-background/95 backdrop-blur-xl border-white/10 text-foreground">
              <MenubarItem onClick={handleOpenInsertLink}>
                <Link className="w-4 h-4 mr-2" /> Insert Link
              </MenubarItem>
              <MenubarItem onClick={handleOpenInsertDate}>
                <CalendarDays className="w-4 h-4 mr-2" /> Insert Date
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          
          <MenubarMenu>
            <MenubarTrigger className="px-3 py-1.5 cursor-pointer hover:bg-white/10 data-[state=open]:bg-white/20 rounded-md transition-colors text-white font-medium">
              Format
            </MenubarTrigger>
            <MenubarContent className="bg-background/95 backdrop-blur-xl border-white/10 text-foreground">
              <MenubarItem onClick={() => formatSelection("*")}>
                <Bold className="w-4 h-4 mr-2" /> Bold
                <MenubarShortcut>⌘B</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onClick={() => formatSelection("_")}>
                <Italic className="w-4 h-4 mr-2" /> Italic
                <MenubarShortcut>⌘I</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onClick={() => formatSelection("~")}>
                <Strikethrough className="w-4 h-4 mr-2" /> Strikethrough
              </MenubarItem>
              <MenubarItem onClick={() => formatSelection("`")}>
                <Code className="w-4 h-4 mr-2" /> Inline Code
              </MenubarItem>
              <MenubarItem onClick={handleQuote}>
                <Quote className="w-4 h-4 mr-2" /> Quote
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger className="px-3 py-1.5 cursor-pointer hover:bg-white/10 data-[state=open]:bg-white/20 rounded-md transition-colors text-white font-medium">
              Tools
            </MenubarTrigger>
            <MenubarContent className="bg-background/95 backdrop-blur-xl border-white/10 text-foreground">
              <MenubarItem onClick={() => setLinkSummaryOpen(true)}>
                <BookMarked className="w-4 h-4 mr-2" /> Link Summary
              </MenubarItem>
              <MenubarSeparator className="bg-white/10" />
              <MenubarItem onClick={() => setSettingsOpen(true)}>
                <Settings className="w-4 h-4 mr-2" /> App Preferences
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger className="px-3 py-1.5 cursor-pointer hover:bg-white/10 data-[state=open]:bg-white/20 rounded-md transition-colors text-white font-medium">
              View
            </MenubarTrigger>
            <MenubarContent className="bg-background/95 backdrop-blur-xl border-white/10 text-foreground min-w-[220px]">
              <MenubarCheckboxItem
                checked={settings.wordWrap}
                onCheckedChange={(checked) =>
                  updateSettings({ wordWrap: checked })
                }
              >
                Word Wrap
              </MenubarCheckboxItem>
              <MenubarSeparator className="bg-white/10" />
              <div className="px-2 py-2">
                <div className="flex justify-between items-center text-sm mb-2">
                  <span>Zoom</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      {settings.zoom}%
                    </span>
                    <button
                      onClick={() => updateSettings({ zoom: 100 })}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Reset
                    </button>
                  </div>
                </div>
                <Slider
                  value={[settings.zoom]}
                  min={25}
                  max={200}
                  step={5}
                  onValueChange={([val]) => updateSettings({ zoom: val })}
                />
              </div>
              <MenubarSeparator className="bg-white/10" />
              <MenubarItem onClick={handleToggleFullscreen}>
                {isFullscreen ? (
                  <>
                    <Minimize className="w-4 h-4 mr-2" /> Exit Full Screen
                  </>
                ) : (
                  <>
                    <Maximize className="w-4 h-4 mr-2" /> Full Screen
                  </>
                )}
                <MenubarShortcut>F11</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator className="bg-white/10" />
              <div
                className="flex items-center justify-between px-2 py-2 cursor-pointer select-none hover:bg-white/5 rounded-sm"
                onClick={() =>
                  updateSettings({
                    editorBg: settings.editorBg === "black" ? "white" : "black",
                    editorTextColor:
                      settings.editorBg === "black" ? "black" : "white",
                  })
                }
              >
                <span className="text-sm">Editor dark mode</span>
                <Switch
                  checked={settings.editorBg === "black"}
                  onCheckedChange={(checked) =>
                    updateSettings({
                      editorBg: checked ? "black" : "white",
                      editorTextColor: checked ? "white" : "black",
                    })
                  }
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>

      {/* Toolbar */}
      <div
        className="flex items-center gap-1 px-4 py-2 border-b border-white/10 z-20 shrink-0 overflow-x-auto custom-scrollbar"
        style={glassStyle}
      >
        <div className="flex items-center gap-1 pr-2 border-r border-white/20 shrink-0">
          <ToolButton
            icon={<File />}
            onClick={handleNewFile}
            tooltip="New File"
          />
          <ToolButton
            icon={<FileText />}
            onClick={() => fileInputRef.current?.click()}
            tooltip="Open File"
          />
          <ToolButton
            icon={<Download />}
            onClick={openDownloadDialog}
            tooltip="Download (Ctrl+S)"
          />
          <ToolButton
            icon={<ImageDown />}
            onClick={handleDownloadAsImage}
            tooltip="Download as Image"
          />
          <ToolButton
            icon={<Share2 />}
            onClick={handleWhatsApp}
            tooltip="Share on WhatsApp"
          />
        </div>

        <div className="flex items-center gap-1 px-2 border-r border-white/20 shrink-0">
          <ToolButton
            icon={<Undo2 />}
            onClick={handleUndo}
            disabled={!canUndo}
            tooltip="Undo (Ctrl+Z)"
          />
          <ToolButton
            icon={<Redo2 />}
            onClick={handleRedo}
            disabled={!canRedo}
            tooltip="Redo (Ctrl+Y)"
          />
          <ToolButton icon={<Scissors />} onClick={handleCut} tooltip="Cut" />
          <ToolButton icon={<Copy />} onClick={handleCopy} tooltip="Copy" />
          <ToolButton
            icon={<ClipboardPaste />}
            onClick={handlePaste}
            tooltip="Paste"
          />
        </div>

        <div className="flex items-center gap-1 px-2 shrink-0 border-r border-white/20">
          <ToolButton
            icon={<Bold />}
            onClick={() => formatSelection("*")}
            tooltip="Bold (Ctrl+B)"
          />
          <ToolButton
            icon={<Italic />}
            onClick={() => formatSelection("_")}
            tooltip="Italic (Ctrl+I)"
          />
          <ToolButton
            icon={<Strikethrough />}
            onClick={() => formatSelection("~")}
            tooltip="Strikethrough"
          />
          <ToolButton
            icon={<Code />}
            onClick={() => formatSelection("`")}
            tooltip="Inline Code"
          />
          <ToolButton icon={<Quote />} onClick={handleQuote} tooltip="Quote" />
        </div>

        <div className="flex items-center gap-1 px-2 shrink-0 border-r border-white/20">
          <ToolButton
            icon={<Link />}
            onClick={handleOpenInsertLink}
            tooltip="Insert Link"
          />
          <ToolButton
            icon={<CalendarDays />}
            onClick={handleOpenInsertDate}
            tooltip="Insert Date"
          />
          <ToolButton
            icon={<BookMarked />}
            onClick={() => setLinkSummaryOpen(true)}
            tooltip="Link Summary"
          />
        </div>

        <div className="flex items-center gap-1 px-2 shrink-0 border-r border-white/20">
          <ToolButton
            icon={<TextSelect />}
            onClick={handleSelectAll}
            tooltip="Select All (Ctrl+A)"
          />
          <ToolButton
            icon={isFullscreen ? <Minimize /> : <Maximize />}
            onClick={handleToggleFullscreen}
            tooltip={
              isFullscreen ? "Exit Full Screen (F11)" : "Full Screen (F11)"
            }
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 md:w-9 md:h-9 text-white hover:bg-white/20 hover:text-white rounded-lg transition-all duration-200 relative"
              >
                <ZoomIn className="w-4 h-4" />
                <span className="absolute -bottom-0.5 -right-0.5 text-[9px] leading-none font-bold text-primary/90">
                  {settings.zoom}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-56 p-3 bg-background/95 backdrop-blur-xl border-white/10 text-foreground shadow-xl"
              side="bottom"
              align="center"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Zoom</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {settings.zoom}%
                  </span>
                  <button
                    onClick={() => updateSettings({ zoom: 100 })}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Reset
                  </button>
                </div>
              </div>
              <Slider
                value={[settings.zoom]}
                min={25}
                max={200}
                step={5}
                onValueChange={([val]) => updateSettings({ zoom: val })}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>25%</span>
                <span>200%</span>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center gap-1 pl-2 shrink-0 ml-auto">
          <ToolButton
            icon={settings.editorBg === "black" ? <Sun /> : <Moon />}
            onClick={() =>
              updateSettings({
                editorBg: settings.editorBg === "black" ? "white" : "black",
                editorTextColor:
                  settings.editorBg === "black" ? "black" : "white",
              })
            }
            tooltip={
              settings.editorBg === "black"
                ? "Switch to Light Editor"
                : "Switch to Dark Editor"
            }
          />
          <ToolButton
            icon={<Settings className="text-primary" />}
            onClick={() => setSettingsOpen(true)}
            tooltip="Preferences"
          />
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden relative z-10 p-4 md:p-6 lg:p-8">
        <div
          className="flex-1 flex w-full max-w-5xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-white/10 ring-1 ring-black/5"
          style={{ backgroundColor: editorStyle.backgroundColor }}
        >
          {/* Line Numbers - hide on small screens */}
          <div
            ref={lineNumbersRef}
            className="hidden md:block w-16 bg-black/40 border-r border-white/10 text-right pr-4 py-6 overflow-hidden select-none font-mono text-white/30"
            style={{ fontSize: editorStyle.fontSize }}
          >
            <div className="flex flex-col">
              {Array.from({ length: Math.max(1, lineCount) }).map((_, i) => (
                <div key={i} className="h-[1.5em] leading-[1.5em]">
                  {i + 1}
                </div>
              ))}
            </div>
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onSelect={handleCursorChange}
            onScroll={handleScroll}
            onKeyUp={handleCursorChange}
            onClick={handleCursorChange}
            spellCheck={false}
            className="flex-1 w-full h-full p-4 md:p-6 resize-none outline-none font-mono custom-scrollbar transition-colors duration-300"
            style={{
              ...editorStyle,
              lineHeight: "1.5em",
            }}
            placeholder="Start typing..."
          />
        </div>
      </div>

      {/* Status Bar */}
      <div
        className="flex items-center justify-between px-4 py-1.5 text-xs text-white/70 border-t border-white/10 z-20 shrink-0 font-mono tracking-wider"
        style={glassStyle}
      >
        <div className="flex gap-4">
          <span>
            Ln {cursorPos.ln}, Col {cursorPos.col}
          </span>
          <span className="hidden sm:inline">Lines: {lineCount}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="hidden sm:inline">
              {isOnline ? "Online" : "Offline"}
            </span>
            {isOnline ? (
              <Wifi className="w-3.5 h-3.5 text-green-400" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-red-400" />
            )}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsDialog
        settings={settings}
        updateSettings={updateSettings}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />

      {/* WhatsApp Share to Number Dialog */}
      <Dialog open={whatsAppDialogOpen} onOpenChange={setWhatsAppDialogOpen}>
        <DialogContent className="sm:max-w-sm bg-background/95 backdrop-blur-xl border-white/10 text-foreground shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-green-500" /> Share to WhatsApp Number
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <div className="space-y-1">
              <Label>WhatsApp number</Label>
              <div className="flex gap-2">
                <div className="flex items-center border border-white/10 bg-black/20 rounded-md px-3 gap-1 shrink-0">
                  <span className="text-muted-foreground text-sm">+</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={whatsAppCountryCode}
                    onChange={(e) =>
                      setWhatsAppCountryCode(e.target.value.replace(/\D/g, ""))
                    }
                    className="w-10 bg-transparent text-sm outline-none py-2 text-center"
                    placeholder="1"
                    maxLength={4}
                  />
                </div>
                <Input
                  type="tel"
                  inputMode="numeric"
                  value={whatsAppPhone}
                  onChange={(e) =>
                    setWhatsAppPhone(e.target.value.replace(/\D/g, ""))
                  }
                  onKeyDown={(e) => e.key === "Enter" && confirmWhatsApp()}
                  placeholder="Phone number"
                  className="flex-1 bg-black/20 border-white/10"
                  autoFocus
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Enter the country code and number without spaces or dashes.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setWhatsAppDialogOpen(false)}
              className="border-white/10"
            >
              Close
            </Button>
            <Button
              onClick={confirmWhatsApp}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={!whatsAppPhone.trim()}
            >
              <MessageSquare className="w-4 h-4 mr-1.5" /> Open Chat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Insert Link Dialog */}
      <Dialog open={insertLinkOpen} onOpenChange={setInsertLinkOpen}>
        <DialogContent className="sm:max-w-sm bg-background/95 backdrop-blur-xl border-white/10 text-foreground shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link className="w-5 h-5 text-primary" /> Insert Link
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <div className="space-y-1">
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && confirmInsertLink()}
                placeholder="https://example.com"
                className="bg-black/20 border-white/10"
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="link-label">
                Label{" "}
                <span className="text-muted-foreground text-xs">
                  (optional)
                </span>
              </Label>
              <Input
                id="link-label"
                value={linkLabel}
                onChange={(e) => setLinkLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && confirmInsertLink()}
                placeholder="Display text"
                className="bg-black/20 border-white/10"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setInsertLinkOpen(false)}
              className="border-white/10"
            >
              Cancel
            </Button>
            <Button onClick={confirmInsertLink} disabled={!linkUrl.trim()}>
              <Link className="w-4 h-4 mr-1.5" /> Insert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Insert Date Dialog */}
      <Dialog open={insertDateOpen} onOpenChange={setInsertDateOpen}>
        <DialogContent className="sm:max-w-xs bg-background/95 backdrop-blur-xl border-white/10 text-foreground shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" /> Insert Date
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <Label htmlFor="insert-date">Choose a date</Label>
            <Input
              id="insert-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirmInsertDate()}
              className="bg-black/20 border-white/10 [color-scheme:dark]"
              autoFocus
            />
            {selectedDate && (
              <p className="text-xs text-muted-foreground">
                Preview:{" "}
                {(() => {
                  const [y, mo, d] = selectedDate.split("-");
                  return new Date(
                    Number(y),
                    Number(mo) - 1,
                    Number(d),
                  ).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  });
                })()}
              </p>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setInsertDateOpen(false)}
              className="border-white/10"
            >
              Cancel
            </Button>
            <Button onClick={confirmInsertDate} disabled={!selectedDate}>
              <CalendarDays className="w-4 h-4 mr-1.5" /> Insert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Summary Dialog */}
      <Dialog open={linkSummaryOpen} onOpenChange={setLinkSummaryOpen}>
        <DialogContent className="sm:max-w-lg bg-background/95 backdrop-blur-xl border-white/10 text-foreground shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookMarked className="w-5 h-5 text-primary" /> Link Summary
              <span className="ml-auto text-xs text-muted-foreground font-normal">
                {extractedLinks.length} link
                {extractedLinks.length !== 1 ? "s" : ""} found
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 max-h-80 overflow-y-auto custom-scrollbar space-y-2 pr-1">
            {extractedLinks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookMarked className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No links found in this document.</p>
              </div>
            ) : (
              extractedLinks.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors group block"
                >
                  <ExternalLink className="w-4 h-4 mt-0.5 shrink-0 text-primary group-hover:text-primary/80" />
                  <div className="min-w-0 flex-1">
                    {link.label !== link.url && (
                      <p className="text-sm font-medium truncate">
                        {link.label}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground truncate">
                      {link.url}
                    </p>
                  </div>
                </a>
              ))
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLinkSummaryOpen(false)}
              className="border-white/10"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Download as Image Filename Dialog */}
      <Dialog
        open={imageDownloadDialogOpen}
        onOpenChange={setImageDownloadDialogOpen}
      >
        <DialogContent className="sm:max-w-sm bg-background/95 backdrop-blur-xl border-white/10 text-foreground shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageDown className="w-5 h-5 text-primary" />
              Save as Image
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <Label htmlFor="image-filename">File name</Label>
            <div className="flex items-center gap-2">
              <Input
                id="image-filename"
                value={imageDownloadFilename}
                onChange={(e) => setImageDownloadFilename(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && confirmDownloadAsImage()}
                className="flex-1 bg-black/20 border-white/10"
                autoFocus
                placeholder="Untitled"
              />
              <span className="text-sm text-muted-foreground shrink-0">
                .png
              </span>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setImageDownloadDialogOpen(false)}
              className="border-white/10"
            >
              Cancel
            </Button>
            <Button onClick={confirmDownloadAsImage}>
              <ImageDown className="w-4 h-4 mr-1.5" /> Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Download Filename Dialog */}
      <Dialog open={downloadDialogOpen} onOpenChange={setDownloadDialogOpen}>
        <DialogContent className="sm:max-w-sm bg-background/95 backdrop-blur-xl border-white/10 text-foreground shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" />
              Save File
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <Label htmlFor="filename">File name</Label>
            <div className="flex items-center gap-2">
              <Input
                id="filename"
                value={downloadFilename}
                onChange={(e) => setDownloadFilename(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && confirmDownload()}
                className="flex-1 bg-black/20 border-white/10"
                autoFocus
                placeholder="untitled"
              />
              <span className="text-sm text-muted-foreground shrink-0">
                .txt
              </span>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDownloadDialogOpen(false)}
              className="border-white/10"
            >
              Cancel
            </Button>
            <Button onClick={confirmDownload}>
              <Download className="w-4 h-4 mr-1.5" /> Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ToolButton({
  icon,
  onClick,
  disabled,
  tooltip,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tooltip: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClick}
          disabled={disabled}
          className="w-8 h-8 md:w-9 md:h-9 text-white hover:bg-white/20 hover:text-white rounded-lg transition-all duration-200"
        >
          {React.cloneElement(icon as React.ReactElement, {
            className: "w-4 h-4 md:w-4.5 md:h-4.5",
          })}
        </Button>
      </TooltipTrigger>
      <TooltipContent className="bg-background border-white/10 text-foreground font-medium text-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}
