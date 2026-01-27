import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TransferTimeline as Timeline } from '../../types/transfer';
import { Colors } from '../../constants/Colors';

interface TransferTimelineProps {
  timeline: Timeline;
}

/**
 * Timeline component showing transfer request progress
 */
export function TransferTimeline({ timeline }: TransferTimelineProps) {
  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const stages = [
    {
      label: 'Requested',
      completed: !!timeline.requestedAt,
      date: timeline.requestedAt,
      user: timeline.requestedBy?.name,
      icon: 'create-outline',
    },
    {
      label: 'Approved',
      completed: !!timeline.approvedAt,
      date: timeline.approvedAt,
      user: timeline.approvedBy?.name,
      icon: 'checkmark-circle-outline',
    },
    {
      label: 'Shipped',
      completed: !!timeline.shippedAt,
      date: timeline.shippedAt,
      icon: 'car-outline',
    },
    {
      label: 'Delivered',
      completed: !!timeline.deliveredAt,
      date: timeline.deliveredAt,
      estimated: timeline.estimatedDeliveryAt,
      icon: 'cube-outline',
    },
    {
      label: 'Received',
      completed: !!timeline.receivedAt,
      date: timeline.receivedAt,
      user: timeline.receivedBy?.name,
      icon: 'checkmark-done-circle-outline',
    },
  ];

  return (
    <View style={styles.container}>
      {stages.map((stage, index) => (
        <View key={index} style={styles.stageContainer}>
          <View style={styles.iconContainer}>
            <View
              style={[
                styles.iconCircle,
                stage.completed ? styles.iconCompleted : styles.iconPending,
              ]}
            >
              <Ionicons
                name={stage.icon as any}
                size={20}
                color={stage.completed ? Colors.success : Colors.gray}
              />
            </View>
            {index < stages.length - 1 && (
              <View
                style={[
                  styles.connector,
                  stage.completed ? styles.connectorCompleted : styles.connectorPending,
                ]}
              />
            )}
          </View>
          <View style={styles.contentContainer}>
            <Text
              style={[
                styles.label,
                stage.completed ? styles.labelCompleted : styles.labelPending,
              ]}
            >
              {stage.label}
            </Text>
            {stage.completed && stage.date && (
              <Text style={styles.date}>{formatDateTime(stage.date)}</Text>
            )}
            {stage.user && (
              <Text style={styles.user}>by {stage.user}</Text>
            )}
            {!stage.completed && stage.estimated && (
              <Text style={styles.estimated}>
                Est: {formatDateTime(stage.estimated)}
              </Text>
            )}
            {!stage.completed && !stage.estimated && index > 0 && stages[index - 1].completed && (
              <Text style={styles.pending}>Pending...</Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  stageContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  iconContainer: {
    alignItems: 'center',
    marginRight: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  iconCompleted: {
    backgroundColor: '#D1FAE5',
    borderColor: Colors.success,
  },
  iconPending: {
    backgroundColor: Colors.lightGray,
    borderColor: Colors.gray,
  },
  connector: {
    width: 2,
    flex: 1,
    marginVertical: 4,
  },
  connectorCompleted: {
    backgroundColor: Colors.success,
  },
  connectorPending: {
    backgroundColor: Colors.gray,
  },
  contentContainer: {
    flex: 1,
    paddingTop: 8,
  },
  label: {
    fontSize: 16,
    marginBottom: 2,
  },
  labelCompleted: {
    fontWeight: '600',
    color: Colors.text,
  },
  labelPending: {
    color: Colors.gray,
  },
  date: {
    fontSize: 14,
    color: Colors.secondaryText,
  },
  user: {
    fontSize: 13,
    color: Colors.gray,
    fontStyle: 'italic',
  },
  estimated: {
    fontSize: 13,
    color: Colors.warning,
    fontStyle: 'italic',
  },
  pending: {
    fontSize: 13,
    color: Colors.gray,
    fontStyle: 'italic',
  },
});
