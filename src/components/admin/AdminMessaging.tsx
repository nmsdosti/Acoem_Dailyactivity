import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Send, Users, User } from "lucide-react";
import { supabase } from "../../../supabase/supabase";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "../../../supabase/auth";

interface Engineer {
  id: string;
  employee_id: string;
  full_name: string;
  email: string;
}

interface AdminMessagingProps {
  engineers: Engineer[];
}

export function AdminMessaging({ engineers }: AdminMessagingProps) {
  const [message, setMessage] = useState("");
  const [recipientType, setRecipientType] = useState<"all" | "specific">("all");
  const [selectedEngineer, setSelectedEngineer] = useState<string>("");
  const [sending, setSending] = useState(false);

  const { toast } = useToast();
  const { user } = useAuth();

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    if (recipientType === "specific" && !selectedEngineer) {
      toast({
        title: "Error",
        description: "Please select an engineer",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const engineer = recipientType === "specific" 
        ? engineers.find(e => e.employee_id === selectedEngineer)
        : null;

      const { error } = await supabase
        .from("notifications")
        .insert({
          message: message.trim(),
          recipient_type: recipientType,
          recipient_engineer_id: engineer?.id || null,
          sent_by: user?.id,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: recipientType === "all" 
          ? "Message sent to all engineers" 
          : `Message sent to ${engineer?.full_name}`,
      });

      // Reset form
      setMessage("");
      setRecipientType("all");
      setSelectedEngineer("");
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Send Message to Engineers
        </CardTitle>
        <CardDescription>
          Send notifications and messages to your engineering team
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Recipient Type Selection */}
        <div className="space-y-2">
          <Label>Send To</Label>
          <div className="flex gap-3">
            <Button
              variant={recipientType === "all" ? "default" : "outline"}
              onClick={() => {
                setRecipientType("all");
                setSelectedEngineer("");
              }}
              className="flex-1 flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              All Engineers
            </Button>
            <Button
              variant={recipientType === "specific" ? "default" : "outline"}
              onClick={() => setRecipientType("specific")}
              className="flex-1 flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              Specific Engineer
            </Button>
          </div>
        </div>

        {/* Engineer Selection (if specific) */}
        {recipientType === "specific" && (
          <div className="space-y-2">
            <Label>Select Engineer</Label>
            <Select value={selectedEngineer} onValueChange={setSelectedEngineer}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an engineer" />
              </SelectTrigger>
              <SelectContent>
                {engineers.map((engineer) => (
                  <SelectItem key={engineer.id} value={engineer.employee_id}>
                    {engineer.full_name} ({engineer.employee_id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Message Input */}
        <div className="space-y-2">
          <Label>Message</Label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here..."
            rows={6}
            className="resize-none"
          />
          <p className="text-xs text-gray-500">
            {message.length} characters
          </p>
        </div>

        {/* Preview */}
        {message && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">Preview</Badge>
              <span className="text-sm text-gray-600">
                {recipientType === "all" 
                  ? `Will be sent to all ${engineers.length} engineers` 
                  : `Will be sent to ${engineers.find(e => e.employee_id === selectedEngineer)?.full_name || '...'}`
                }
              </span>
            </div>
            <p className="text-sm">{message}</p>
          </div>
        )}

        {/* Send Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSendMessage}
            disabled={sending || !message.trim() || (recipientType === "specific" && !selectedEngineer)}
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            {sending ? "Sending..." : "Send Message"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
