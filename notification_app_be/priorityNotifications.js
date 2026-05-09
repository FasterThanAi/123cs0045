function getTypeWeight(type) {
  const weights = {
    Placement: 300,
    Result: 200,
    Event: 100
  };

  return weights[type] || 0;
}

function getRecencyScore(timestamp) {
  const notificationTime = new Date(timestamp).getTime();

  if (Number.isNaN(notificationTime)) {
    return 0;
  }

  const currentTime = Date.now();
  const ageInHours = Math.floor((currentTime - notificationTime) / (1000 * 60 * 60));

  return Math.max(0, 100 - ageInHours);
}

function getPriorityScore(notification) {
  return getTypeWeight(notification.Type) + getRecencyScore(notification.Timestamp);
}

function getTopPriorityNotifications(notifications, limit = 10) {
  if (!Array.isArray(notifications)) {
    return [];
  }

  return notifications
    .map((notification) => ({
      ...notification,
      priorityScore: getPriorityScore(notification)
    }))
    .sort((a, b) => {
      if (b.priorityScore !== a.priorityScore) {
        return b.priorityScore - a.priorityScore;
      }

      return new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime();
    })
    .slice(0, limit);
}

module.exports = {
  getTopPriorityNotifications
};