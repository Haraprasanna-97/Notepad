import React, { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Settings2, ImageUp, Palette, Type, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type AppSettings = {
  appBgColor: string;
  appBgImage: string;
  glassTransparency: number;
  glassBlur: number;
  editorBg: "black" | "white";
  editorTextColor: "black" | "white" | "yellow";
  wordWrap: boolean;
  zoom: number;
};

interface SettingsDialogProps {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ settings, updateSettings, open, onOpenChange }: SettingsDialogProps) {
  const bgImageInputRef = useRef<HTMLInputElement>(null);

  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (re) => {
      updateSettings({ appBgImage: re.target?.result as string });
    };
    reader.readAsDataURL(file);
    if (bgImageInputRef.current) bgImageInputRef.current.value = '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-background/95 backdrop-blur-xl border-white/10 text-foreground shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
            <Settings2 className="w-6 h-6 text-primary" />
            Preferences
          </DialogTitle>
        </DialogHeader>

        <input
          ref={bgImageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleBgImageUpload}
        />

        <div className="grid gap-8 py-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          
          {/* App Theme Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2 border-b border-white/10 pb-2">
              <Palette className="w-5 h-5 text-accent" /> App Theme
            </h3>
            
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Background Color</Label>
                <div className="flex gap-2">
                  <Input 
                    type="color" 
                    value={settings.appBgColor}
                    onChange={(e) => updateSettings({ appBgColor: e.target.value })}
                    className="w-12 h-10 p-1 cursor-pointer bg-black/20 border-white/10"
                  />
                  <Input 
                    type="text" 
                    value={settings.appBgColor}
                    onChange={(e) => updateSettings({ appBgColor: e.target.value })}
                    className="flex-1 bg-black/20 border-white/10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Background Image</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => bgImageInputRef.current?.click()}
                    className="border-white/10 hover:bg-white/10 gap-2 shrink-0"
                  >
                    <ImageUp className="w-4 h-4" />
                    Upload Image
                  </Button>
                  <Input 
                    type="text" 
                    placeholder="or paste URL..."
                    value={settings.appBgImage}
                    onChange={(e) => updateSettings({ appBgImage: e.target.value })}
                    className="flex-1 bg-black/20 border-white/10 min-w-0"
                  />
                  {settings.appBgImage && (
                    <Button 
                      variant="ghost"
                      size="icon"
                      onClick={() => updateSettings({ appBgImage: "" })}
                      className="shrink-0 hover:bg-white/10 text-muted-foreground hover:text-foreground"
                      title="Clear image"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {settings.appBgImage && (
                  <div
                    className="w-full h-16 rounded-lg border border-white/10 bg-cover bg-center mt-1"
                    style={{ backgroundImage: `url(${settings.appBgImage})` }}
                  />
                )}
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <Label>Glass Transparency</Label>
                  <span className="text-xs text-muted-foreground">{settings.glassTransparency}%</span>
                </div>
                <Slider 
                  value={[settings.glassTransparency]} 
                  min={0} 
                  max={100} 
                  step={1}
                  onValueChange={([val]) => updateSettings({ glassTransparency: val })}
                />
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <Label>Glass Blur</Label>
                  <span className="text-xs text-muted-foreground">{settings.glassBlur}px</span>
                </div>
                <Slider 
                  value={[settings.glassBlur]} 
                  min={0} 
                  max={100} 
                  step={1}
                  onValueChange={([val]) => updateSettings({ glassBlur: val })}
                />
              </div>
            </div>
          </div>

          {/* Editor Theme Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2 border-b border-white/10 pb-2">
              <Type className="w-5 h-5 text-primary" /> Editor Theme
            </h3>
            
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <Label className="flex flex-col gap-1">
                  <span>Editor Background</span>
                  <span className="text-xs text-muted-foreground font-normal">Solid color for the writing area</span>
                </Label>
                <Select 
                  value={settings.editorBg} 
                  onValueChange={(val: "black" | "white") => updateSettings({ 
                    editorBg: val,
                    editorTextColor: (val === "white" && settings.editorTextColor === "yellow") ? "black" : settings.editorTextColor
                  })}
                >
                  <SelectTrigger className="w-[120px] bg-black/20 border-white/10">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="black">Black</SelectItem>
                    <SelectItem value="white">White</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label>Text Color</Label>
                <Select 
                  value={settings.editorTextColor} 
                  onValueChange={(val: "black" | "white" | "yellow") => updateSettings({ editorTextColor: val })}
                >
                  <SelectTrigger className="w-[120px] bg-black/20 border-white/10">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="white" disabled={settings.editorBg === "white"}>White</SelectItem>
                    <SelectItem value="black" disabled={settings.editorBg === "black"}>Black</SelectItem>
                    <SelectItem value="yellow" disabled={settings.editorBg === "white"}>Yellow</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <Label className="flex flex-col gap-1">
                  <span>Word Wrap</span>
                  <span className="text-xs text-muted-foreground font-normal">Wrap long lines of text</span>
                </Label>
                <Switch 
                  checked={settings.wordWrap}
                  onCheckedChange={(checked) => updateSettings({ wordWrap: checked })}
                />
              </div>
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
