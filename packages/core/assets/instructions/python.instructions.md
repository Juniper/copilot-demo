---
applyTo: '**/*.py'
---

Apply general guidelines present in [Copilot Instructions](../copilot-instructions.md) to all code.

**Follow these coding standards, domain knowledge, and preferences for Python projects**

- **Use clear, consistent imports** (prefer relative imports within packages).

- **Use `__init__.py` files** to define package structure and expose necessary modules.

- **Always** follow PEP8 style guide for Python code, including naming conventions, indentation, and line length.

- **Use type hints** for function signatures and class attributes to improve code readability and maintainability.

- **Use docstrings** for all public classes and functions, following the [Google Python Style Guide](https://google.github.io/styleguide/pyguide.html#38-comments-and-docstrings).

- **Use logging** instead of print statements for debugging and information output. Configure logging with appropriate levels (DEBUG, INFO, WARNING, ERROR, CRITICAL).

- Example of structured logging in Python:
```python
import logging

logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)

try:
        # Example logic
        result = 10 / 0
except ZeroDivisionError as e:
        logger.error("Division by zero occurred: %s", e)
```

- **Use `pytest`** for unit testing, following the [pytest documentation](https://docs.pytest.org/en/stable/).

- **Use `mypy`** for static type checking, following the [mypy documentation](https://mypy.readthedocs.io/en/stable/).

- **Use `black`** for code formatting, following the [Black documentation](https://black.readthedocs.io/en/stable/).

- **Use `flake8`** for linting, following the [Flake8 documentation](https://flake8.pycqa.org/en/latest/).

- **Use `isort`** for sorting imports, following the [isort documentation](https://pycqa.github.io/isort/).

- **Use `pydocstyle`** for checking compliance with Python docstring conventions, following the [pydocstyle documentation](https://pydocstyle.readthedocs.io/en/stable/).

- Docstrings should be written using the Google Style Guide format. Here’s an example:

```python

def example():

"""

Brief summary.


Args:

param1 (type): Description.


Returns:

type: Description.

"""

```

- **Use `bandit`** for security analysis, following the [Bandit documentation](https://bandit.readthedocs.io/en/latest/).

- **Use `coverage.py`** for measuring code coverage of tests, following the [coverage.py documentation](https://coverage.readthedocs.io/en/stable/).

- **Integrate monitoring tools** (e.g., Sentry, Prometheus) for real-time error tracking and alerting **AFTER** confirming with the user.

- **Document known error scenarios** and their resolutions in the project documentation.

- **Test error handling logic** with unit tests to ensure reliability.

- **Use `pydantic` for data validation**.

- Use `FastAPI` for APIs and `SQLAlchemy` or `SQLModel` for ORM if applicable.