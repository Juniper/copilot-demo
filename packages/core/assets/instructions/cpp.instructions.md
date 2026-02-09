---
applyTo: '**/*.c,**/*.cpp, **/*.h, **/*.hpp'
---
# C/C++ Code Generation Instructions

- Try to optimize memory management and usage as much as possible.

- Use a logging library like `spdlog` or `glog` for C++.
- For C, consider using `syslog` or a custom logging function.

- For C, use the C standard library and avoid C++ features.
    - Use `#include` for header files and avoid using `using namespace std;`.
    - Use `NULL` for null pointers in C.
    - Use `malloc`, `calloc`, or `realloc` for dynamic memory allocation, and `free` for deallocation.
    - Use `struct` for defining data structures. 
    - Use `char` arrays for string manipulation.
    - Use `typedef` for defining type aliases.
    - Use function pointers for callbacks.
    - Use `union` for union types.

- For C++, use the C++ standard library and modern C++ features (C++11 and later).
    - Use `#include` for header files and avoid using `using namespace std;`.
    - Use `nullptr` instead of `NULL` in C++.
    - Use `std::unique_ptr` or `std::shared_ptr` for dynamic memory management.
    - Use `std::vector` or `std::array` for dynamic arrays instead of raw arrays.
    - Use `std::string` for string manipulation instead of C-style strings.
    - Use `std::map` or `std::unordered_map` for associative arrays instead of C-style structs.
    - Use `std::function` for function pointers and callbacks.
    - Use `std::optional` for optional values instead of using pointers or special values.
    - Use `std::variant` for union types instead of C-style unions. 

