# Generate C++ Unit Tests

For general instructions about generating C++ unit tests, refer to the [testing instructions](.github/instructions/testing.instructions.md).

Instructions:
- Use the Google Test (gtest) framework.
- Write one test case per public method.
- Cover edge cases and invalid inputs.
- Mock dependencies where appropriate.
- Include comments explaining the purpose of each test.
- Use descriptive names for test cases.
- Ensure tests are self-contained and do not rely on external state.
- Use assertions to verify expected outcomes.
    - Use `ASSERT_*` for conditions that should never fail and `EXPECT_*` for conditions that can fail.
    - Use `SetUp()` and `TearDown()` methods for common setup and cleanup tasks.
    - Use `TEST_F` for tests that require a fixture.
    - Use `TEST_P` for parameterized tests.
    - Use `INSTANTIATE_TEST_SUITE_P` for instantiating parameterized tests.
    - Use `ASSERT_THROW` or `EXPECT_THROW` for testing exceptions.
    - Use `ASSERT_EQ`, `EXPECT_EQ`, `ASSERT_NE`, `EXPECT_NE`, etc., for comparing values.
    - Use `ASSERT_TRUE`, `EXPECT_TRUE`, `ASSERT_FALSE`, `EXPECT_FALSE` for boolean checks.
    - Use `ASSERT_STREQ`, `EXPECT_STREQ`, `ASSERT_STRNE`, `EXPECT_STRNE` for string comparisons.
    - Use `ASSERT_DOUBLE_EQ`, `EXPECT_DOUBLE_EQ` for floating-point comparisons.
    - Use `ASSERT_FLOAT_EQ`, `EXPECT_FLOAT_EQ` for single-precision floating-point comparisons.
    - Use `ASSERT_LE`, `EXPECT_LE`, `ASSERT_LT`, `EXPECT_LT`, `ASSERT_GE`, `EXPECT_GE`, `ASSERT_GT`, `EXPECT_GT` for numerical comparisons.
    - Use `ASSERT_NO_THROW` or `EXPECT_NO_THROW` for code that should not throw exceptions.
    - Use `ASSERT_ANY_THROW` or `EXPECT_ANY_THROW` for code that should throw any exception 

