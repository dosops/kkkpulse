import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { useI18n } from "@/lib/i18n";
import { Comment } from "@/lib/store";
import { formatRelativeTime } from "@/lib/utils";

interface CommentsSectionProps {
  comments: Comment[];
  onAddComment: (text: string) => void;
}

export function CommentsSection({ comments, onAddComment }: CommentsSectionProps) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const [newComment, setNewComment] = useState("");

  const handleSend = () => {
    const trimmed = newComment.trim();
    if (trimmed) {
      onAddComment(trimmed);
      setNewComment("");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundDefault }]}>
      <ThemedText type="h4" style={styles.sectionTitle}>
        {t.dialog.title}
      </ThemedText>

      {comments.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="message-circle" size={24} color={theme.textSecondary} />
          <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
            {t.dialog.noComments}
          </ThemedText>
        </View>
      ) : (
        <View style={styles.commentsList}>
          {comments.map((comment) => (
            <View key={comment.id} style={[styles.commentItem, { borderBottomColor: theme.border }]}>
              <View style={styles.commentHeader}>
                <View style={[styles.avatar, { backgroundColor: theme.backgroundSecondary }]}>
                  <Feather name="user" size={14} color={theme.textSecondary} />
                </View>
                <ThemedText type="small" style={{ fontWeight: "600" }}>
                  {comment.userName}
                </ThemedText>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  {formatRelativeTime(comment.createdAt)}
                </ThemedText>
              </View>
              <ThemedText type="body" style={styles.commentText}>
                {comment.text}
              </ThemedText>
            </View>
          ))}
        </View>
      )}

      <View style={[styles.inputContainer, { borderTopColor: theme.border }]}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.backgroundSecondary,
              color: theme.text,
            },
          ]}
          value={newComment}
          onChangeText={setNewComment}
          placeholder={t.dialog.placeholder}
          placeholderTextColor={theme.textSecondary}
          multiline
          maxLength={500}
        />
        <Pressable
          onPress={handleSend}
          disabled={!newComment.trim()}
          style={({ pressed }) => [
            styles.sendButton,
            {
              backgroundColor: newComment.trim() ? theme.primary : theme.backgroundSecondary,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Feather
            name="send"
            size={18}
            color={newComment.trim() ? "#FFFFFF" : theme.textSecondary}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  commentsList: {
    marginBottom: Spacing.md,
  },
  commentItem: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  commentText: {
    marginLeft: 32,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.sm,
    borderTopWidth: 1,
    paddingTop: Spacing.md,
  },
  input: {
    flex: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    maxHeight: 100,
    minHeight: 40,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
