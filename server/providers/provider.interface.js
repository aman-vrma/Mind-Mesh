class BaseProvider {
  constructor(name) {
    if (new.target === BaseProvider) {
      throw new TypeError("Cannot construct BaseProvider directly.");
    }
    this.name = name;
  }

  async generateResponse(systemPrompt, userPrompt) {
    throw new Error("Method 'generateResponse()' must be implemented.");
  }
}

module.exports = BaseProvider;