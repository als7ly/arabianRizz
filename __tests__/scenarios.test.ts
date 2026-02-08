import { SCENARIO_CATEGORIES, ScenarioCategory, Scenario } from '../constants/scenarios';

describe('Scenario Constants', () => {
  it('should be an array of categories', () => {
    expect(Array.isArray(SCENARIO_CATEGORIES)).toBe(true);
    expect(SCENARIO_CATEGORIES.length).toBeGreaterThan(0);
  });

  it('should have valid structure for each category', () => {
    SCENARIO_CATEGORIES.forEach((category: ScenarioCategory) => {
      expect(category).toHaveProperty('id');
      expect(category).toHaveProperty('label');
      expect(category).toHaveProperty('scenarios');
      expect(Array.isArray(category.scenarios)).toBe(true);
    });
  });

  it('should have valid structure for each scenario', () => {
    SCENARIO_CATEGORIES.forEach((category: ScenarioCategory) => {
      category.scenarios.forEach((scenario: Scenario) => {
        expect(scenario).toHaveProperty('id');
        expect(scenario).toHaveProperty('label');
        expect(scenario).toHaveProperty('icon');
        expect(scenario).toHaveProperty('instruction');
        expect(typeof scenario.instruction).toBe('string');
        expect(scenario.instruction.length).toBeGreaterThan(10); // Ensure meaningful instruction
      });
    });
  });

  it('should have unique scenario IDs', () => {
    const ids = new Set<string>();
    SCENARIO_CATEGORIES.forEach((category: ScenarioCategory) => {
        category.scenarios.forEach((scenario: Scenario) => {
            expect(ids.has(scenario.id)).toBe(false);
            ids.add(scenario.id);
        });
    });
  });
});
