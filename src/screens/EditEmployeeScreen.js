import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";

import {
  Text,
  TextInput,
  Button,
  Surface,
  Icon,
  Divider,
  ActivityIndicator,
} from "react-native-paper";

import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../api/client";

const COLORS = {
  primary: "#007AFF",
  primaryDark: "#005ecb",
  primarySoft: "#EAF2FF",
  danger: "#d32f2f",
  textDark: "#1c1c1e",
  textMuted: "#8e8e93",
  iconMuted: "#6b7280",
  chipIdle: "#f1f3f5",
  divider: "#eceef1",
};

// ======================================================
// SHOP ROLES
// ======================================================

const SHOP_ROLES = ["Manager", "Salesman", "Stockist"];

// ======================================================
// ROLE PERMISSIONS
//
// IMPORTANT:
// These are DISPLAY permissions.
//
// The backend remains the source of truth.
// The frontend cannot grant permissions independently.
// ======================================================

const DEFAULT_PERMISSIONS = {
  Manager: [
    "view_financials",
    "view_reports",
    "manage_inventory",
    "manage_employees",
    "create_sale",
    "view_sales",
    "view_inventory",
    "edit_shop_settings",
  ],

  Salesman: ["create_sale", "view_own_sales", "view_inventory"],

  Stockist: ["manage_inventory", "view_inventory"],
};

// ======================================================
// PERMISSION DISPLAY INFORMATION
// ======================================================

const PERMISSIONS = [
  {
    key: "view_inventory",
    label: "View Inventory",
    description: "Can see products and current stock.",
    icon: "package-variant",
  },
  {
    key: "manage_inventory",
    label: "Manage Inventory",
    description: "Can add, edit and update stock.",
    icon: "package-variant-closed",
  },
  {
    key: "create_sale",
    label: "Create Sale",
    description: "Can create sales for customers.",
    icon: "cart-arrow-up",
  },
  {
    key: "view_own_sales",
    label: "View Own Sales",
    description: "Can see their own sales.",
    icon: "account-cash",
  },
  {
    key: "view_sales",
    label: "View Sales",
    description: "Can see sales made by employees.",
    icon: "chart-line",
  },
  {
    key: "view_financials",
    label: "View Financials",
    description: "Can view financial information.",
    icon: "cash-multiple",
  },
  {
    key: "view_reports",
    label: "View Reports",
    description: "Can view shop reports.",
    icon: "file-chart",
  },
  {
    key: "manage_employees",
    label: "Manage Employees",
    description: "Can add and manage employees.",
    icon: "account-group",
  },
  {
    key: "edit_shop_settings",
    label: "Edit Shop Settings",
    description: "Can change shop settings.",
    icon: "cog",
  },
];

// ======================================================
// COMPONENT
// ======================================================

const EditEmployeeScreen = ({ employee, setActiveTab }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [role, setRole] = useState("Salesman");

  const [shops, setShops] = useState([]);
  const [selectedShops, setSelectedShops] = useState([]);

  const [loadingShops, setLoadingShops] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // ======================================================
  // LOAD EMPLOYEE
  // ======================================================

  useEffect(() => {
    if (!employee) {
      return;
    }

    console.log("EDITING EMPLOYEE:", employee);

    setFirstName(employee.first_name || "");
    setLastName(employee.last_name || "");
    setPhone(employee.mobile || "");
    setEmail(employee.email || "");

    /*
     * Employee list normally gives:
     *
     * employee.role
     *
     * getEmployeeDetails may give the role inside shops.
     */
    let employeeRole = employee.role;

    if (!employeeRole && Array.isArray(employee.shops)) {
      const activeShop = employee.shops.find(
        (shop) =>
          shop.shopCode === employee.shopCode ||
          shop.shop_code === employee.shopCode,
      );

      if (activeShop?.role) {
        employeeRole = activeShop.role;
      }
    }

    setRole(employeeRole || "Salesman");

    // ====================================================
    // LOAD EXISTING SHOP ASSIGNMENTS
    // ====================================================

    if (Array.isArray(employee.shops)) {
      const existingShopCodes = employee.shops
        .map((shop) => shop.shopCode || shop.shop_code || shop.code)
        .filter(Boolean);

      setSelectedShops(existingShopCodes);
    } else if (employee.shopCode) {
      setSelectedShops([employee.shopCode]);
    } else if (employee.shop_code) {
      setSelectedShops([employee.shop_code]);
    } else {
      setSelectedShops([]);
    }

    fetchManageableShops();
  }, [employee]);

  // ======================================================
  // FETCH SHOPS THE REQUESTER CAN MANAGE
  // ======================================================

  const fetchManageableShops = async () => {
    try {
      setLoadingShops(true);

      const token = await AsyncStorage.getItem("userToken");

      /*
       * IMPORTANT:
       *
       * Do NOT use /my-owned-shops here.
       *
       * A Manager may be allowed to manage employees
       * in shops that they do not own.
       *
       * The backend should expose something like:
       *
       * GET /employees/manageable-shops
       *
       * and determine the shops from req.user.id.
       */

      const response = await api.get("/employees/manageable-shops", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("MANAGEABLE SHOPS RESPONSE:", response.data);

      const responseShops = Array.isArray(response.data)
        ? response.data
        : response.data.shops || [];

      setShops(responseShops);
    } catch (error) {
      console.error(
        "FETCH MANAGEABLE SHOPS ERROR:",
        error.response?.data || error.message,
      );

      Alert.alert(
        "Error",
        error.response?.data?.error || "Could not load manageable shops.",
      );
    } finally {
      setLoadingShops(false);
    }
  };

  // ======================================================
  // CHANGE ROLE
  // ======================================================

  const handleRoleChange = (newRole) => {
    setRole(newRole);

    /*
     * Permissions are role-based on the backend.
     *
     * Therefore we don't send custom permissions
     * to the backend.
     *
     * This only updates the UI preview.
     */
  };

  // ======================================================
  // TOGGLE SHOP
  // ======================================================

  const toggleShop = (shopCode) => {
    setSelectedShops((current) => {
      if (current.includes(shopCode)) {
        return current.filter((code) => code !== shopCode);
      }

      return [...current, shopCode];
    });
  };

  // ======================================================
  // UPDATE EMPLOYEE
  // ======================================================

  const handleUpdate = async () => {
    if (!employee?.id) {
      Alert.alert("Error", "Employee ID is missing.");
      return;
    }

    if (!firstName.trim()) {
      Alert.alert("Error", "First name is required.");
      return;
    }

    if (!phone.trim()) {
      Alert.alert("Error", "Phone number is required.");
      return;
    }

    if (!role) {
      Alert.alert("Error", "Please select a role.");
      return;
    }

    if (selectedShops.length === 0) {
      Alert.alert("Error", "Please assign at least one shop.");
      return;
    }

    try {
      setIsSaving(true);

      const token = await AsyncStorage.getItem("userToken");

      // ==================================================
      // IMPORTANT SECURITY CHANGE
      // ==================================================
      //
      // We send only the employee information,
      // role and requested shop codes.
      //
      // DO NOT send:
      //
      // requesterId
      // activeShopCode
      //
      // DO NOT trust permissions from frontend.
      //
      // Backend determines whether requester can manage
      // every requested shop.
      // ==================================================

      const payload = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        mobile: phone.trim(),
        email: email.trim(),

        role,

        shop_codes: selectedShops,
      };

      console.log("UPDATE EMPLOYEE PAYLOAD:", payload);

      const response = await api.put(`/employees/${employee.id}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("UPDATE EMPLOYEE RESPONSE:", response.data);

      Alert.alert("Success", "Employee updated successfully.", [
        {
          text: "OK",
          onPress: () => setActiveTab("EmployeeList"),
        },
      ]);
    } catch (error) {
      console.error(
        "UPDATE EMPLOYEE ERROR:",
        error.response?.data || error.message,
      );

      const status = error.response?.status;

      const backendError = error.response?.data?.error;

      /*
       * Specifically explain authorization failures.
       */

      if (status === 403) {
        Alert.alert(
          "Permission Denied",
          backendError ||
            "You are not allowed to manage one or more selected shops.",
        );

        return;
      }

      if (status === 400) {
        Alert.alert(
          "Invalid Request",
          backendError ||
            "Please check the employee information and shop assignments.",
        );

        return;
      }

      Alert.alert("Error", backendError || "Could not update employee.");
    } finally {
      setIsSaving(false);
    }
  };

  // ======================================================
  // DELETE EMPLOYEE
  // ======================================================

  const handleDelete = () => {
    Alert.alert(
      "Delete Employee",
      `Are you sure you want to remove ${firstName} ${lastName}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: deleteEmployee,
        },
      ],
    );
  };

  const deleteEmployee = async () => {
    try {
      setIsDeleting(true);

      const token = await AsyncStorage.getItem("userToken");

      await api.delete(`/employees/${employee.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      Alert.alert("Deleted", "Employee has been removed.", [
        {
          text: "OK",
          onPress: () => setActiveTab("EmployeeList"),
        },
      ]);
    } catch (error) {
      console.error(
        "DELETE EMPLOYEE ERROR:",
        error.response?.data || error.message,
      );

      Alert.alert(
        "Error",
        error.response?.data?.error || "Could not delete employee.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // ======================================================
  // NO EMPLOYEE
  // ======================================================

  if (!employee) {
    return (
      <View style={styles.center}>
        <Text>No employee selected.</Text>

        <Button onPress={() => setActiveTab("EmployeeList")}>
          Back to Employees
        </Button>
      </View>
    );
  }

  // ======================================================
  // CURRENT ROLE PERMISSIONS
  // ======================================================

  const rolePermissions = DEFAULT_PERMISSIONS[role] || [];

  // ======================================================
  // UI
  // ======================================================

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* BACK */}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setActiveTab("EmployeeList")}
        >
          <Icon source="arrow-left" size={20} color={COLORS.textDark} />

          <Text style={styles.backText}>Back to Employees</Text>
        </TouchableOpacity>

        <Surface style={styles.card} elevation={2}>
          {/* HEADER */}

          <View style={styles.headerRow}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {firstName ? firstName.charAt(0).toUpperCase() : "E"}
              </Text>
            </View>

            <View style={styles.headerInfo}>
              <Text variant="titleLarge" style={styles.screenTitle}>
                Edit Employee
              </Text>

              <Text variant="bodyMedium" style={styles.screenSubtitle}>
                Manage employee information, role and shop access.
              </Text>
            </View>
          </View>

          <Divider style={styles.divider} />

          {/* BASIC INFORMATION */}

          <Text style={styles.sectionTitle}>Employee Information</Text>

          <TextInput
            label="First Name"
            value={firstName}
            onChangeText={setFirstName}
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="account-outline" />}
          />

          <TextInput
            label="Last Name"
            value={lastName}
            onChangeText={setLastName}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            mode="outlined"
            keyboardType="phone-pad"
            style={styles.input}
            left={<TextInput.Icon icon="phone-outline" />}
          />

          <TextInput
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            left={<TextInput.Icon icon="email-outline" />}
          />

          <Divider style={styles.divider} />

          {/* ROLE */}

          <Text style={styles.sectionTitle}>Shop Role</Text>

          <Text style={styles.helperText}>
            Permissions are controlled by the employee's role.
          </Text>

          <View style={styles.roleContainer}>
            {SHOP_ROLES.map((shopRole) => {
              const active = role === shopRole;

              return (
                <TouchableOpacity
                  key={shopRole}
                  style={[styles.roleChip, active && styles.roleChipActive]}
                  onPress={() => handleRoleChange(shopRole)}
                >
                  <Icon
                    source={
                      shopRole === "Manager"
                        ? "account-tie"
                        : shopRole === "Salesman"
                          ? "cart"
                          : "package-variant"
                    }
                    size={18}
                    color={active ? COLORS.primary : COLORS.iconMuted}
                  />

                  <Text
                    style={[styles.roleText, active && styles.roleTextActive]}
                  >
                    {shopRole}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Divider style={styles.divider} />

          {/* SHOPS */}

          <Text style={styles.sectionTitle}>Assign Shops</Text>

          <Text style={styles.helperText}>
            Only shops that you are authorized to manage can be assigned.
          </Text>

          {loadingShops ? (
            <ActivityIndicator
              style={{
                marginVertical: 20,
              }}
            />
          ) : shops.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon
                source="store-off-outline"
                size={32}
                color={COLORS.textMuted}
              />

              <Text style={styles.emptyText}>
                No manageable shops available.
              </Text>
            </View>
          ) : (
            <View style={styles.shopContainer}>
              {shops.map((shop) => {
                const shopCode = shop.shop_code || shop.shopCode || shop.code;

                const shopName =
                  shop.shop_name || shop.shopName || shop.name || shopCode;

                if (!shopCode) {
                  return null;
                }

                const selected = selectedShops.includes(shopCode);

                return (
                  <TouchableOpacity
                    key={shopCode}
                    style={[
                      styles.shopCard,
                      selected && styles.shopCardSelected,
                    ]}
                    onPress={() => toggleShop(shopCode)}
                  >
                    <View
                      style={[
                        styles.shopIcon,
                        selected && styles.shopIconSelected,
                      ]}
                    >
                      <Icon
                        source="store"
                        size={22}
                        color={selected ? "#fff" : COLORS.iconMuted}
                      />
                    </View>

                    <View style={styles.shopInfo}>
                      <Text style={styles.shopName}>{shopName}</Text>

                      <Text style={styles.shopCode}>{shopCode}</Text>
                    </View>

                    {selected && (
                      <Icon
                        source="check-circle"
                        size={24}
                        color={COLORS.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <Divider style={styles.divider} />

          {/* PERMISSIONS */}

          <Text style={styles.sectionTitle}>Role Permissions</Text>

          <Text style={styles.helperText}>
            These permissions come from the selected role and are enforced by
            the backend.
          </Text>

          <View style={styles.permissionContainer}>
            {PERMISSIONS.map((permission) => {
              const enabled = rolePermissions.includes(permission.key);

              return (
                <View
                  key={permission.key}
                  style={[
                    styles.permissionCard,
                    enabled && styles.permissionCardActive,
                  ]}
                >
                  <View
                    style={[
                      styles.permissionIcon,
                      enabled && styles.permissionIconActive,
                    ]}
                  >
                    <Icon
                      source={permission.icon}
                      size={21}
                      color={enabled ? "#fff" : COLORS.iconMuted}
                    />
                  </View>

                  <View style={styles.permissionInfo}>
                    <Text style={styles.permissionTitle}>
                      {permission.label}
                    </Text>

                    <Text style={styles.permissionDescription}>
                      {permission.description}
                    </Text>
                  </View>

                  <Icon
                    source={
                      enabled ? "checkbox-marked" : "checkbox-blank-outline"
                    }
                    size={25}
                    color={enabled ? COLORS.primary : COLORS.iconMuted}
                  />
                </View>
              );
            })}
          </View>

          <Divider style={styles.divider} />

          {/* SECURITY NOTICE */}

          <View style={styles.securityNotice}>
            <Icon source="shield-check" size={22} color={COLORS.primary} />

            <Text style={styles.securityText}>
              Shop access is verified by the server. You cannot assign this
              employee to shops you are not authorized to manage.
            </Text>
          </View>

          {/* SAVE */}

          <Button
            mode="contained"
            onPress={handleUpdate}
            loading={isSaving}
            disabled={isSaving || isDeleting}
            style={styles.saveButton}
            contentStyle={styles.buttonContent}
          >
            Save Changes
          </Button>

          {/* DELETE */}

          <Button
            mode="outlined"
            onPress={handleDelete}
            loading={isDeleting}
            disabled={isSaving || isDeleting}
            style={styles.deleteButton}
            contentStyle={styles.buttonContent}
            icon="trash-can-outline"
            textColor={COLORS.danger}
          >
            Remove Employee
          </Button>
        </Surface>
      </ScrollView>
    </View>
  );
};

// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 50,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingVertical: 8,
  },

  backText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textDark,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },

  avatarText: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
  },

  headerInfo: {
    flex: 1,
  },

  screenTitle: {
    fontWeight: "bold",
    color: COLORS.textDark,
  },

  screenSubtitle: {
    color: COLORS.textMuted,
    marginTop: 2,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: 6,
  },

  helperText: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginBottom: 14,
    lineHeight: 19,
  },

  input: {
    backgroundColor: "#fff",
    marginBottom: 14,
  },

  divider: {
    backgroundColor: COLORS.divider,
    marginVertical: 20,
  },

  roleContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  roleChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.chipIdle,
    paddingVertical: 11,
    paddingHorizontal: 15,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "transparent",
  },

  roleChipActive: {
    backgroundColor: COLORS.primarySoft,
    borderColor: COLORS.primary,
  },

  roleText: {
    marginLeft: 7,
    color: COLORS.textMuted,
    fontWeight: "600",
  },

  roleTextActive: {
    color: COLORS.primary,
    fontWeight: "700",
  },

  shopContainer: {
    gap: 10,
  },

  shopCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.divider,
    backgroundColor: "#fff",
  },

  shopCardSelected: {
    backgroundColor: COLORS.primarySoft,
    borderColor: COLORS.primary,
  },

  shopIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.chipIdle,
    justifyContent: "center",
    alignItems: "center",
  },

  shopIconSelected: {
    backgroundColor: COLORS.primary,
  },

  shopInfo: {
    flex: 1,
    marginLeft: 12,
  },

  shopName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textDark,
  },

  shopCode: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  emptyContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },

  emptyText: {
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 8,
  },

  permissionContainer: {
    gap: 10,
  },

  permissionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.divider,
    backgroundColor: "#fff",
  },

  permissionCardActive: {
    backgroundColor: COLORS.primarySoft,
    borderColor: COLORS.primary,
  },

  permissionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.chipIdle,
    alignItems: "center",
    justifyContent: "center",
  },

  permissionIconActive: {
    backgroundColor: COLORS.primary,
  },

  permissionInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },

  permissionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textDark,
  },

  permissionDescription: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 3,
    lineHeight: 17,
  },

  securityNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.primarySoft,
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
  },

  securityText: {
    flex: 1,
    marginLeft: 10,
    color: COLORS.textDark,
    fontSize: 12,
    lineHeight: 18,
  },

  buttonContent: {
    paddingVertical: 6,
  },

  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    marginBottom: 14,
  },

  deleteButton: {
    borderColor: COLORS.danger,
    borderRadius: 12,
  },
});

export default EditEmployeeScreen;
