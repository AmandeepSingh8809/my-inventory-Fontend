import React, { useEffect, useState } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import api from '../api/client';
import { Text, Card, ActivityIndicator, Chip } from "react-native-paper";

import AsyncStorage from "@react-native-async-storage/async-storage";

const EmployeeListScreen = ({ setActiveTab, setSelectedEmployee }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

 const fetchEmployees = async () => {
  try {
    const token = await AsyncStorage.getItem("userToken");
    const shopCode = await AsyncStorage.getItem("activeShopCode");

    console.log("TOKEN:", !!token);
    console.log("SHOP CODE:", shopCode);

    const response = await api.get("/employees", {
      headers: {
        Authorization: `Bearer ${token}`,
        "x-shop-code": shopCode,
      },
    });

    console.log("EMPLOYEE API RESPONSE:", response.data);

    setEmployees(response.data);

  } catch (error) {
    console.error("Employee fetch error:");

    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else if (error.request) {
      console.error("No response from server:", error.request);
    } else {
      console.error("Request error:", error.message);
    }

  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchEmployees();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const openEmployee = (employee) => {
    setSelectedEmployee(employee);

    setActiveTab("EditEmployee");
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>
        Employees
      </Text>

      <FlatList
        data={employees}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 30 }}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => openEmployee(item)}>
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium">
                  {item.first_name} {item.last_name}
                </Text>

                <Text style={styles.username}>@{item.username}</Text>

                <Text>{item.email}</Text>

                <View style={styles.row}>
                  <Chip>{item.role}</Chip>

                  <Text style={styles.shop}>{item.shop_name}</Text>
                </View>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },

  title: {
    fontWeight: "700",
    marginBottom: 16,
  },

  card: {
    marginBottom: 12,
  },

  username: {
    color: "#777",
    marginBottom: 8,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },

  shop: {
    marginLeft: 10,
    color: "#666",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default EmployeeListScreen;
