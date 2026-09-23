"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createPost } from "../actions";
import { toast } from "sonner";

export function PostForm({ threadId }: { threadId: string }) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error("Content required");
      return;
    }
    setIsSubmitting(true);
    const fd = new FormData();
    fd.set("thread_id", threadId);
    fd.set("content", content);
    const res = await createPost(fd);
    if (res.success) {
      toast.success("Reply posted");
      setContent("");
    } else toast.error(res.error.message);
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-2">
      <Label>Reply</Label>
      <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Tulis balasan..." rows={3} />
      <Button onClick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? "Posting..." : "Post Reply"}
      </Button>
    </div>
  );
}
