exports.getChangedFields = (oldDoc, newDoc) => {
  const changes = [];
  Object.keys(newDoc).forEach((key) => {
    if (
      newDoc[key] !== undefined &&
      key !== "_id" &&
      String(oldDoc[key]) !== String(newDoc[key])
    ) {
      changes.push({
        field: key,
        from: oldDoc[key],
        to: newDoc[key],
      });
    }
  });
  return changes;
};
