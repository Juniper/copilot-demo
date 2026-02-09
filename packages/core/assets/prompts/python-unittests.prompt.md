# Generate Python Unit Tests

For general instructions about generating tests, refer to the [testing instructions](../instructions/testing.instructions.md).

Instructions:

- Use the `pytest` framework.

- Write one test class per function or class being tested.

- Cover edge cases and invalid inputs.

- Include docstrings for each test method.

- Mock external dependencies where necessary.

- Ensure tests are self-contained and independent.
- Use fixtures for setup and teardown if needed.
- Use `assert` statements for checking conditions.

- Use the following Pytest notations:
    - Use `pytest.mark.parametrize` for parameterized tests.
    - Use `pytest.raises` for testing exceptions.
    - Use `pytest.skip` for skipping tests that are not applicable.
    - Use `pytest.fixture` for reusable setup code.
    - Use `pytest.mark.asyncio` for testing asynchronous code.
    - Use `pytest.mark.slow` for tests that are expected to take longer to run.
    - Use `pytest.mark.unit` for unit tests.
    - Use `pytest.mark.smoke` for smoke tests.
    - Use `pytest.mark.performance` for performance tests.
    - Use `pytest.mark.security` for security tests.
    - Use `pytest.mark.documentation` for tests related to documentation.
    - Use `pytest.mark.dependency` for tests that depend on other tests.
    - Use `pytest.mark.skipif` for skipping tests based on conditions.
    - Use `pytest.mark.xfail` for expected failures.
    - Use `pytest.mark.flaky` for tests that may intermittently fail.

