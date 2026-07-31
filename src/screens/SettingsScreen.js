import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, List, Switch, Divider, Button } from 'react-native-paper';

export default function SettingsScreen() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>App Settings</Text>
      
      <List.Section>
        <List.Subheader>Preferences</List.Subheader>
        <List.Item
          title="Dark Mode"
          left={props => <List.Icon {...props} icon="theme-light-dark" />}
          right={() => <Switch color='#007AFF'value={isDarkMode} onValueChange={setIsDarkMode} />}
        />
        <List.Item
          title="Push Notifications"
          description="Low stock alerts and daily summaries"
          left={props => <List.Icon {...props} icon="bell-outline" />}
          right={() => <Switch color='#007AFF' value={notifications} onValueChange={setNotifications} />}
        />
      </List.Section>

      <Divider style={styles.divider} />

      <List.Section>
        <List.Subheader>Store Configuration</List.Subheader>
        <List.Item
          title="Currency"
          description="Indian Rupee (₹)"
          left={props => <List.Icon {...props} icon="currency-inr" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
        />
        <List.Item
          title="Tax Rate (GST)"
          description="Currently set to 18%"
          left={props => <List.Icon {...props} icon="brightness-percent" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
        />
      </List.Section>

     
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontWeight: 'bold', marginBottom: 20 },
  divider: { marginVertical: 10 },
});