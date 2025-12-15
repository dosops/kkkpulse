import React, { useState, useSyncExternalStore } from "react";
import { View, StyleSheet, Pressable, Modal } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Spacing, Colors, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { store } from "@/lib/store";
import { useI18n } from "@/lib/i18n";

export function OrganizationSelector() {
  const { theme, isDark } = useTheme();
  const { t } = useI18n();
  const [modalVisible, setModalVisible] = useState(false);
  const colors = isDark ? Colors.dark : Colors.light;

  const currentOrg = useSyncExternalStore(
    store.subscribe,
    store.getCurrentOrganization,
    store.getCurrentOrganization
  );

  const userOrganizations = useSyncExternalStore(
    store.subscribe,
    store.getUserOrganizations,
    store.getUserOrganizations
  );

  const handleSelectOrg = (orgId: string) => {
    store.setCurrentOrganization(orgId);
    setModalVisible(false);
  };

  if (userOrganizations.length <= 1) {
    return null;
  }

  return (
    <>
      <Pressable
        onPress={() => setModalVisible(true)}
        style={[styles.selectorButton, { backgroundColor: theme.backgroundSecondary }]}
      >
        <ThemedText type="small" style={styles.orgName}>
          {currentOrg.shortName}
        </ThemedText>
        <Feather name="chevron-down" size={14} color={theme.textSecondary} />
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View 
            style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHeader}>
              <ThemedText type="h4">{t.organization.selectOrganization}</ThemedText>
              <Pressable onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>
            {userOrganizations.map((org) => (
              <Pressable
                key={org.id}
                onPress={() => handleSelectOrg(org.id)}
                style={[
                  styles.orgOption,
                  { backgroundColor: org.id === currentOrg.id ? colors.primary + '15' : 'transparent' },
                ]}
              >
                <View style={styles.orgInfo}>
                  <View style={[styles.orgBadge, { backgroundColor: colors.primary }]}>
                    <ThemedText type="small" style={styles.orgBadgeText}>
                      {org.shortName}
                    </ThemedText>
                  </View>
                  <ThemedText type="body">{org.name}</ThemedText>
                </View>
                {org.id === currentOrg.id ? (
                  <Feather name="check" size={20} color={colors.primary} />
                ) : null}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selectorButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  orgName: {
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  orgOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  orgInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  orgBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  orgBadgeText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
