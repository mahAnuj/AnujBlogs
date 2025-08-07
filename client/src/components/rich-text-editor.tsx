import { useState, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Bold,
  Italic,
  Code,
  Link,
  Image,
  Video,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start writing your post...",
  className,
}: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [linkDialog, setLinkDialog] = useState(false);
  const [imageDialog, setImageDialog] = useState(false);
  const [videoDialog, setVideoDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const insertText = (before: string, after: string = "", placeholder: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const textToInsert = selectedText || placeholder;
    
    const newValue = 
      value.substring(0, start) + 
      before + 
      textToInsert + 
      after + 
      value.substring(end);
    
    onChange(newValue);
    
    // Set cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + textToInsert.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const insertAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const newValue = value.substring(0, start) + text + value.substring(start);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + text.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleBold = () => insertText("**", "**", "bold text");
  const handleItalic = () => insertText("*", "*", "italic text");
  const handleCode = () => insertText("`", "`", "code");
  const handleH1 = () => insertText("# ", "", "Heading 1");
  const handleH2 = () => insertText("## ", "", "Heading 2");
  const handleH3 = () => insertText("### ", "", "Heading 3");
  const handleQuote = () => insertText("> ", "", "Quote");
  const handleUnorderedList = () => insertText("- ", "", "List item");
  const handleOrderedList = () => insertText("1. ", "", "List item");

  const handleCodeBlock = () => {
    insertText("```\n", "\n```", "// Your code here");
  };

  const handleInsertLink = () => {
    if (linkUrl && linkText) {
      insertAtCursor(`[${linkText}](${linkUrl})`);
      setLinkUrl("");
      setLinkText("");
      setLinkDialog(false);
    }
  };

  const handleInsertImage = () => {
    if (imageUrl) {
      insertAtCursor(`![${imageAlt || "Image"}](${imageUrl})`);
      setImageUrl("");
      setImageAlt("");
      setImageDialog(false);
    }
  };

  const handleInsertVideo = () => {
    if (videoUrl) {
      // Convert YouTube URLs to embed format
      let embedUrl = videoUrl;
      if (videoUrl.includes("youtube.com/watch")) {
        const videoId = videoUrl.split("v=")[1]?.split("&")[0];
        if (videoId) {
          embedUrl = `https://www.youtube.com/embed/${videoId}`;
        }
      } else if (videoUrl.includes("youtu.be/")) {
        const videoId = videoUrl.split("youtu.be/")[1]?.split("?")[0];
        if (videoId) {
          embedUrl = `https://www.youtube.com/embed/${videoId}`;
        }
      }
      
      insertAtCursor(`<iframe width="560" height="315" src="${embedUrl}" frameborder="0" allowfullscreen></iframe>\n\n`);
      setVideoUrl("");
      setVideoDialog(false);
    }
  };

  return (
    <div className={className}>
      {/* Toolbar */}
      <div className="border border-gray-300 dark:border-slate-600 rounded-t-lg bg-gray-50 dark:bg-slate-700 p-2">
        <div className="flex flex-wrap gap-1">
          {/* Text Formatting */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleBold}
            title="Bold"
          >
            <Bold size={16} />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleItalic}
            title="Italic"
          >
            <Italic size={16} />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCode}
            title="Inline Code"
          >
            <Code size={16} />
          </Button>

          <div className="w-px h-6 bg-gray-300 dark:bg-slate-600 mx-1" />

          {/* Headings */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleH1}
            title="Heading 1"
          >
            <Heading1 size={16} />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleH2}
            title="Heading 2"
          >
            <Heading2 size={16} />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleH3}
            title="Heading 3"
          >
            <Heading3 size={16} />
          </Button>

          <div className="w-px h-6 bg-gray-300 dark:bg-slate-600 mx-1" />

          {/* Lists and Quote */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleUnorderedList}
            title="Bullet List"
          >
            <List size={16} />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleOrderedList}
            title="Numbered List"
          >
            <ListOrdered size={16} />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleQuote}
            title="Quote"
          >
            <Quote size={16} />
          </Button>

          <div className="w-px h-6 bg-gray-300 dark:bg-slate-600 mx-1" />

          {/* Media */}
          <Dialog open={linkDialog} onOpenChange={setLinkDialog}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                title="Insert Link"
              >
                <Link size={16} />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Insert Link</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="linkText">Link Text</Label>
                  <Input
                    id="linkText"
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                    placeholder="Click here"
                  />
                </div>
                <div>
                  <Label htmlFor="linkUrl">URL</Label>
                  <Input
                    id="linkUrl"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
                <Button onClick={handleInsertLink} disabled={!linkUrl || !linkText}>
                  Insert Link
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={imageDialog} onOpenChange={setImageDialog}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                title="Insert Image"
              >
                <Image size={16} />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Insert Image</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <Input
                    id="imageUrl"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div>
                  <Label htmlFor="imageAlt">Alt Text (optional)</Label>
                  <Input
                    id="imageAlt"
                    value={imageAlt}
                    onChange={(e) => setImageAlt(e.target.value)}
                    placeholder="Description of the image"
                  />
                </div>
                <Button onClick={handleInsertImage} disabled={!imageUrl}>
                  Insert Image
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={videoDialog} onOpenChange={setVideoDialog}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                title="Insert Video"
              >
                <Video size={16} />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Insert Video</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="videoUrl">Video URL</Label>
                  <Input
                    id="videoUrl"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="YouTube URL or embed URL"
                  />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Supports YouTube URLs. Other video platforms should use embed URLs.
                </p>
                <Button onClick={handleInsertVideo} disabled={!videoUrl}>
                  Insert Video
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCodeBlock}
            title="Code Block"
            className="text-xs"
          >
            {"</>"}
          </Button>
        </div>
      </div>

      {/* Text Area */}
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-[400px] border-t-0 rounded-t-none focus:ring-0 font-mono text-sm resize-none"
      />

      {/* Preview Note */}
      <div className="border border-t-0 border-gray-300 dark:border-slate-600 rounded-b-lg bg-gray-50 dark:bg-slate-700 px-3 py-2">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Supports Markdown formatting. Use the toolbar buttons or type Markdown syntax directly.
        </p>
      </div>
    </div>
  );
}
