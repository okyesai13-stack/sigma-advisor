import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Square, Play, Loader2, Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface VoiceRecorderProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  transcription: string;
  isTranscribing: boolean;
  audioLevel: number;
  disabled?: boolean;
}

const VoiceRecorder = ({
  isRecording,
  onStartRecording,
  onStopRecording,
  transcription,
  isTranscribing,
  audioLevel,
  disabled = false,
}: VoiceRecorderProps) => {
  // Audio visualization bars
  const visualizerBars = Array.from({ length: 20 }, (_, i) => i);

  return (
    <Card className="p-6 bg-card/50 border-2 border-dashed border-primary/30">
      <div className="flex flex-col items-center gap-6">
        {/* Audio Visualizer */}
        <div className="flex items-center justify-center gap-1 h-16 w-full">
          {visualizerBars.map((i) => {
            const barHeight = isRecording
              ? Math.max(8, Math.min(64, (audioLevel / 128) * 64 + Math.random() * 20))
              : 8;
            return (
              <motion.div
                key={i}
                animate={{ height: barHeight }}
                transition={{ duration: 0.1 }}
                className={cn(
                  "w-1.5 rounded-full",
                  isRecording ? "bg-primary" : "bg-muted"
                )}
                style={{ minHeight: 8 }}
              />
            );
          })}
        </div>

        {/* Record Button */}
        <div className="relative">
          <motion.div
            animate={isRecording ? { scale: [1, 1.2, 1] } : { scale: 1 }}
            transition={{ repeat: isRecording ? Infinity : 0, duration: 1.5 }}
            className={cn(
              "absolute inset-0 rounded-full",
              isRecording && "bg-destructive/30"
            )}
            style={{ transform: 'scale(1.5)' }}
          />
          <Button
            size="lg"
            className={cn(
              "w-20 h-20 rounded-full relative",
              isRecording
                ? "bg-destructive hover:bg-destructive/90"
                : "bg-primary hover:bg-primary/90"
            )}
            onClick={isRecording ? onStopRecording : onStartRecording}
            disabled={disabled || isTranscribing}
          >
            {isTranscribing ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : isRecording ? (
              <Square className="w-8 h-8 fill-current" />
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </Button>
        </div>

        {/* Status Text */}
        <div className="text-center">
          <p className={cn(
            "text-sm font-medium",
            isRecording ? "text-destructive" : "text-muted-foreground"
          )}>
            {isTranscribing
              ? "Transcribing your response..."
              : isRecording
              ? "Recording... Tap to stop"
              : "Tap to start voice answer"}
          </p>
          {isRecording && (
            <p className="text-xs text-muted-foreground mt-1">
              Speak clearly into your microphone
            </p>
          )}
        </div>

        {/* Live Transcription */}
        {(transcription || isTranscribing) && (
          <div className="w-full p-4 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2 mb-2">
              <Volume2 className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Live Transcription</span>
            </div>
            <p className="text-sm text-muted-foreground min-h-[40px]">
              {transcription || (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Listening...
                </span>
              )}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default VoiceRecorder;
