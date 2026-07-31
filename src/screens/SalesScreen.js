import React, { useState } from "react";
import api, { getImageUrl } from "../api/client";

import {
  Alert,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  View,
  Image,
} from "react-native";
import {
  Button,
  Card,
  Divider,
  IconButton,
  List,
  Searchbar,
  Text,
  TextInput,
} from "react-native-paper";
import BarcodeScannerModal from "../components/BarcodeScannerModal";

export default function SalesScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [cart, setCart] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Customer Info States
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerGst, setCustomerGst] = useState("");

  // Share Receipt States
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);

  // 1. Manual Search & Scanner Input
  const executeSearch = async (text) => {
    const cleanText = text.replace(/[\r\n\t]/g, "").trim();
    setSearchQuery(cleanText);

    if (cleanText.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await api.get(`/search?query=${cleanText}`);
      const results = response.data;

      if (results.length === 1) {
        const item = results[0];

        // Bulletproof database extraction
        const dbCode = item.code ? String(item.code).trim().toLowerCase() : "";
        const dbCarton = item.carton_code || item.cartonCode;
        const cleanDbCarton = dbCarton
          ? String(dbCarton).trim().toLowerCase()
          : "";
        const searchTarget = cleanText.toLowerCase();

        if (dbCode === searchTarget || cleanDbCarton === searchTarget) {
          // Exact barcode match!
          addToCart(item, cleanText);
          return;
        }
      }

      setSearchResults(results);
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  const handleScanSuccess = async (scannedCode) => {
    setScannerVisible(false);
    const cleanCode = scannedCode.replace(/[\r\n\t]/g, "").trim();
    setSearchQuery(cleanCode);

    try {
      const response = await api.get(`/search?query=${cleanCode}`);
      const results = response.data;
      if (results.length === 1) {
        addToCart(results[0], cleanCode);
      } else {
        setSearchResults(results);
      }
    } catch (error) {
      Alert.alert("Error", "Could not find scanned item.");
    }
  };

  // 2. Cart Management (🚨 UPGRADED: BULLETPROOF CARTON LOGIC)
  const addToCart = (product, scannedBarcode = null, forceCarton = false) => {
    if (product.quantity <= 0) {
      Alert.alert("Out of Stock", `${product.name} has 0 stock available!`);
      setSearchResults([]);
      setSearchQuery("");
      return;
    }

    let qtyToAdd = 1; // Default to 1 piece (Loose)

    // 🚨 BULLETPROOF CHECK: Handles camelCase, string vs numbers, and invisible spaces
    const dbCartonCode = product.carton_code || product.cartonCode || "";
    const dbCartonMultiplier =
      product.carton_multiplier || product.cartonMultiplier || 1;

    const scannedStr = scannedBarcode
      ? String(scannedBarcode).trim().toLowerCase()
      : "";
    const cartonStr = dbCartonCode
      ? String(dbCartonCode).trim().toLowerCase()
      : "";

    if (
      forceCarton ||
      (scannedStr !== "" && cartonStr !== "" && scannedStr === cartonStr)
    ) {
      qtyToAdd = parseFloat(dbCartonMultiplier) || 1;
    }

    const existingItem = cart.find((item) => item.id === product.id);

    if (existingItem) {
      const newTotalQty = parseFloat(existingItem.cartQty) + qtyToAdd;

      if (newTotalQty <= product.quantity) {
        updateCartItem(product.id, "cartQty", String(newTotalQty));
      } else {
        Alert.alert(
          "Stock Limit",
          `Only ${product.quantity} available in stock. Cannot add ${qtyToAdd} more.`,
        );
      }
    } else {
      if (qtyToAdd <= product.quantity) {
        setCart([
          {
            ...product,
            cartQty: String(qtyToAdd),
            sellPrice: String(product.price),
          },
          ...cart,
        ]);
      } else {
        Alert.alert(
          "Stock Limit",
          `Only ${product.quantity} available, but you tried to add a box of ${qtyToAdd}.`,
        );
      }
    }

    setSearchResults([]);
    setSearchQuery("");
  };

  const updateCartItem = (id, field, value) => {
    setCart(
      cart.map((item) => {
        if (item.id === id) {
          if (field === "cartQty") {
            const integerOnlyUnits = [6, 7, 8]; // pcs, dozen, pack
            const isIntegerOnly = integerOnlyUnits.includes(
              Number(item.unit_id),
            );

            if (isIntegerOnly && value.includes(".")) {
              Alert.alert(
                "Whole Numbers Only",
                `You cannot sell fractions of ${item.unit_name || "this item"}.`,
              );
              return item;
            }

            if (parseFloat(value) > item.quantity) {
              Alert.alert("Stock Limit", `Only ${item.quantity} available.`);
              return { ...item, cartQty: String(item.quantity) };
            }
          }
          return { ...item, [field]: value };
        }
        return item;
      }),
    );
  };

  const removeFromCart = (id) => setCart(cart.filter((item) => item.id !== id));

  const grandTotal = cart.reduce((sum, item) => {
    return (
      sum + (parseFloat(item.cartQty) || 1) * (parseFloat(item.sellPrice) || 0)
    );
  }, 0);

  // 3. Process Checkout
  const processCheckout = async () => {
    if (!customerName || !customerPhone) {
      Alert.alert(
        "Required",
        "Please enter at least the Customer Name and Phone Number.",
      );
      return;
    }

    setIsProcessing(true);

    try {
      const customerDataString = JSON.stringify({
        name: customerName,
        phone: customerPhone,
        gst: customerGst,
      });

      const payload = {
        items: cart.map((item) => ({
          productId: item.id,
          quantity: parseFloat(item.cartQty) || 1,
          unitPrice: parseFloat(item.sellPrice) || 0,
          totalAmount:
            (parseFloat(item.sellPrice) || 0) * (parseFloat(item.cartQty) || 1),
        })),
        paymentMethod: "CASH",
        customerInfo: customerDataString,
      };

      await api.post("/sales/bulk", payload);

      setLastOrder({
        items: cart,
        total: grandTotal,
        customer: {
          name: customerName,
          phone: customerPhone,
          gst: customerGst,
        },
      });

      setCart([]);
      setCheckoutModalVisible(false);
      setCustomerName("");
      setCustomerPhone("");
      setCustomerGst("");
      setShareModalVisible(true);
    } catch (error) {
      Alert.alert("Error", "Failed to process checkout.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Generate & Share Bill
  const generateBillText = () => {
    if (!lastOrder) return "";
    let text = `*INVOICE*\nCustomer: ${lastOrder.customer.name}\n`;
    if (lastOrder.customer.gst) text += `GST: ${lastOrder.customer.gst}\n`;
    text += `----------------------\n`;
    lastOrder.items.forEach((item) => {
      text += `${item.name} x ${item.cartQty} = ₹${item.sellPrice * item.cartQty}\n`;
    });
    text += `----------------------\n`;
    text += `*Total: ₹${lastOrder.total}*\n`;
    text += `Thank you for shopping with us!`;
    return text;
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(generateBillText());
    Linking.openURL(
      `whatsapp://send?phone=91${lastOrder.customer.phone}&text=${text}`,
    );
  };

  const shareViaTelegram = () => {
    const text = encodeURIComponent(generateBillText());
    Linking.openURL(`https://t.me/+91${lastOrder.customer.phone}?text=${text}`);
  };

  const shareViaEmail = () => {
    const text = encodeURIComponent(generateBillText());
    Linking.openURL(`mailto:?subject=Invoice from Store&body=${text}`);
  };

  return (
    <View style={styles.container}>
      {/* SEARCH BAR */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Scan code or type name..."
          onChangeText={executeSearch}
          value={searchQuery}
          style={styles.searchBar}
          autoFocus
        />
        <Button
          mode="contained"
          icon="barcode-scan"
          onPress={() => setScannerVisible(true)}
          style={styles.scanBtn}
        >
          Scan
        </Button>
      </View>

      {/* RESULTS / CART */}
      {searchResults.length > 0 ? (
        <ScrollView style={styles.resultsList}>
          {searchResults.map((item) => (
            <React.Fragment key={item.id}>
              <List.Item
                title={item.name}
                description={`Stock: ${item.quantity}`}
                left={() =>
                  item.image_url ? (
                    <Image
                      source={{ uri: getImageUrl(item.image_url) }}
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 8,
                        marginLeft: 10,
                      }}
                    />
                  ) : (
                    <View
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 8,
                        backgroundColor: "#e3f2fd",
                        justifyContent: "center",
                        alignItems: "center",
                        marginLeft: 10,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 20,
                          fontWeight: "bold",
                          color: "#1565c0",
                        }}
                      >
                        {item.name ? item.name.charAt(0).toUpperCase() : "?"}
                      </Text>
                    </View>
                  )
                }
                /* 🚨 UPGRADED: Added a dedicated "Add Box" button if it's a carton item! */
                right={() => {
                  const hasCarton =
                    item.carton_multiplier || item.cartonMultiplier;
                  const cartonQty = parseFloat(hasCarton);

                  return (
                    <View
                      style={{
                        alignItems: "flex-end",
                        justifyContent: "center",
                        marginRight: 10,
                      }}
                    >
                      <Text style={styles.priceTag}>₹{item.price}</Text>
                      {cartonQty > 1 && (
                        <Button
                          mode="outlined"
                          compact
                          style={{
                            marginTop: 5,
                            borderColor: "#007AFF",
                            borderRadius: 4,
                          }}
                          labelStyle={{
                            fontSize: 10,
                            marginHorizontal: 8,
                            marginVertical: 2,
                          }}
                          onPress={() => addToCart(item, null, true)}
                        >
                          + Box ({cartonQty})
                        </Button>
                      )}
                    </View>
                  );
                }}
                /* Tapping the row itself adds 1 loose item */
                onPress={() => addToCart(item, searchQuery)}
              />
              <Divider />
            </React.Fragment>
          ))}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          <ScrollView style={styles.cartContainer}>
            {cart.length === 0 ? (
              <Text style={styles.emptyText}>
                Cart is empty. Scan an item to begin.
              </Text>
            ) : (
              cart.map((item) => (
                <Card key={item.id} style={styles.cartCard}>
                  <Card.Title
                    title={item.name}
                    right={(props) => (
                      <IconButton
                        {...props}
                        icon="delete"
                        iconColor="#d32f2f"
                        onPress={() => removeFromCart(item.id)}
                      />
                    )}
                  />
                  <Card.Content>
                    <View style={styles.cartControls}>
                      <View style={{ flex: 1, marginRight: 10 }}>
                        <Text variant="labelMedium">Price (₹)</Text>
                        <TextInput
                          mode="outlined"
                          value={String(item.sellPrice)}
                          onChangeText={(val) =>
                            updateCartItem(item.id, "sellPrice", val)
                          }
                          keyboardType="numeric"
                          dense
                          style={{ backgroundColor: "#fff" }}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          variant="labelMedium"
                          style={{ textAlign: "center" }}
                        >
                          Qty
                        </Text>
                        <View style={styles.qtyControls}>
                          <IconButton
                            icon="minus"
                            size={18}
                            onPress={() =>
                              updateCartItem(
                                item.id,
                                "cartQty",
                                String(Math.max(1, parseInt(item.cartQty) - 1)),
                              )
                            }
                          />
                          <TextInput
                            value={String(item.cartQty)}
                            onChangeText={(val) =>
                              updateCartItem(item.id, "cartQty", val)
                            }
                            keyboardType="numeric"
                            dense
                            style={styles.qtyInput}
                          />
                          <IconButton
                            icon="plus"
                            size={18}
                            onPress={() =>
                              updateCartItem(
                                item.id,
                                "cartQty",
                                String(parseInt(item.cartQty) + 1),
                              )
                            }
                          />
                        </View>
                      </View>
                      <View
                        style={{
                          flex: 1,
                          alignItems: "flex-end",
                          justifyContent: "center",
                          marginLeft: -45,
                          marginRight: 30,
                          marginTop: 15,
                        }}
                      >
                        <Text
                          variant="titleMedium"
                          style={{ fontWeight: "bold" }}
                        >
                          ₹
                          {(
                            (parseFloat(item.sellPrice) || 0) *
                            (parseFloat(item.cartQty) || 1)
                          ).toLocaleString()}
                        </Text>
                      </View>
                      {item.image_url ? (
                        <Image
                          source={{ uri: getImageUrl(item.image_url) }}
                          style={{
                            width: 70,
                            height: 70,
                            borderRadius: 8,
                          }}
                        />
                      ) : (
                        <View
                          style={{
                            width: 70,
                            height: 70,
                            borderRadius: 8,
                            backgroundColor: "#e3f2fd",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 24,
                              fontWeight: "bold",
                              color: "#1565c0",
                            }}
                          >
                            {item.name
                              ? item.name.charAt(0).toUpperCase()
                              : "?"}
                          </Text>
                        </View>
                      )}
                    </View>
                  </Card.Content>
                </Card>
              ))
            )}
          </ScrollView>

          {/* CHECKOUT TRIGGER */}
          {cart.length > 0 && (
            <View style={styles.footer}>
              <View style={styles.totalRow}>
                <Text variant="headlineSmall">Grand Total:</Text>
                <Text variant="headlineSmall" style={styles.totalText}>
                  ₹{grandTotal.toLocaleString()}
                </Text>
              </View>
              <Button
                mode="contained"
                buttonColor="#2e7d32"
                onPress={() => setCheckoutModalVisible(true)}
                style={styles.checkoutBtn}
              >
                Proceed to Checkout ({cart.length} items)
              </Button>
            </View>
          )}
        </View>
      )}

      {/* --- CHECKOUT MODAL --- */}
      <Modal
        visible={checkoutModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text
              variant="titleLarge"
              style={{ marginBottom: 15, fontWeight: "bold" }}
            >
              Customer Details
            </Text>

            <TextInput
              label="Customer Name *"
              value={customerName}
              onChangeText={setCustomerName}
              mode="outlined"
              style={styles.modalInput}
            />
            <TextInput
              label="Mobile Number *"
              value={customerPhone}
              onChangeText={setCustomerPhone}
              mode="outlined"
              keyboardType="phone-pad"
              style={styles.modalInput}
            />
            <TextInput
              label="GST Number (Optional)"
              value={customerGst}
              onChangeText={setCustomerGst}
              mode="outlined"
              autoCapitalize="characters"
              style={styles.modalInput}
            />

            <View style={{ marginTop: 20 }}>
              <Button
                mode="contained"
                buttonColor="#2e7d32"
                onPress={processCheckout}
                loading={isProcessing}
                style={{ marginBottom: 10 }}
              >
                Confirm Sale
              </Button>
              <Button
                mode="outlined"
                onPress={() => setCheckoutModalVisible(false)}
                disabled={isProcessing}
                textColor='#007AFF'

              >
                Cancel
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- SHARE RECEIPT MODAL --- */}
      <Modal
        visible={shareModalVisible}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text
              variant="titleLarge"
              style={{
                marginBottom: 10,
                textAlign: "center",
                color: "#2e7d32",
                fontWeight: "bold",
              }}
            >
              Sale Successful!
            </Text>
            <Text style={{ marginBottom: 20, textAlign: "center" }}>
              Share the invoice with {lastOrder?.customer?.name}
            </Text>

            <Button
              mode="contained"
              icon="whatsapp"
              buttonColor="#25D366"
              onPress={shareViaWhatsApp}
              style={styles.shareBtn}
            >
              Share via WhatsApp
            </Button>
            <Button
              mode="contained"
              icon="send"
              buttonColor="#0088cc"
              onPress={shareViaTelegram}
              style={styles.shareBtn}
            >
              Share via Telegram
            </Button>
            <Button
              mode="contained"
              icon="email"
              buttonColor="#ea4335"
              onPress={shareViaEmail}
              style={styles.shareBtn}
            >
              Share via Email
            </Button>

            <Button
              mode="text"
              onPress={() => setShareModalVisible(false)}
              style={{ marginTop: 10 }}
              textColor="#0088cc"
            >
              Skip / Close
            </Button>
          </View>
        </View>
      </Modal>

      <BarcodeScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onScanSuccess={handleScanSuccess}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f8f9fa" },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  searchBar: { flex: 1, marginRight: 8, backgroundColor: "#fff" },
  scanBtn: {
    height: 50,
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#007AFF",
  },
  resultsList: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 8,
    elevation: 2,
  },
  priceTag: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007AFF",
    textAlign: "right",
  },

  cartContainer: { flex: 1 },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: "#888",
    fontSize: 16,
  },
  cartCard: { backgroundColor: "#fff", elevation: 2, marginBottom: 12 },
  cartControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  qtyControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  qtyInput: { width: 45, textAlign: "center", backgroundColor: "#f0f0f0" },

  footer: {
    borderTopWidth: 1,
    borderColor: "#ddd",
    paddingTop: 16,
    marginTop: 8,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  totalText: { fontWeight: "bold", color: "#2e7d32" },
  checkoutBtn: { paddingVertical: 8 },

  // Modal Styles
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    elevation: 5,
  },
  modalInput: { marginBottom: 10, backgroundColor: "#fff" },
  shareBtn: { paddingVertical: 5, marginBottom: 12 },
});
