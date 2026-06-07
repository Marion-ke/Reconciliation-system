export const mockPolicy = {
  eventDefinitions: {
    CHECKOUT: {},
    RETURN: {},
    TRANSFER: {},
    INSPECT: {},
    REPAIR: {},
    RETIRE: {},
  },

  allowedConditions: [
    "new",
    "good",
    "worn",
    "scratched",
    "damaged",
    "unusable",
  ],
};
