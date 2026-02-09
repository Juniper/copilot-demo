# Algorithms Time Complexity Guide

## Big-O Notation Overview

**Big-O notation** describes the upper bound of an algorithm's time complexity as input size approaches infinity. It measures how runtime scales with input size, ignoring constants and lower-order terms.

**Why Big-O is used:**
- Provides a standardized way to compare algorithm efficiency
- Focuses on scalability rather than implementation details
- Hardware and language independent analysis

**Why Big-O is important:**
- Predicts performance on large datasets
- Guides algorithm selection for specific use cases
- Essential for writing scalable software

## Sorting Algorithms Time Complexity Summary

| Algorithm | Best Case | Average Case | Worst Case |
|-----------|-----------|--------------|------------|
| Bubble Sort | O(n) | O(n²) | O(n²) |
| Selection Sort | O(n²) | O(n²) | O(n²) |
| Insertion Sort | O(n) | O(n²) | O(n²) |
| Merge Sort | O(n log n) | O(n log n) | O(n log n) |
| Quick Sort | O(n log n) | O(n log n) | O(n²) |
| Heap Sort | O(n log n) | O(n log n) | O(n log n) |
| Counting Sort | O(n + k) | O(n + k) | O(n + k) |
| Radix Sort | O(d(n + k)) | O(d(n + k)) | O(d(n + k)) |

## Algorithm Analysis

### Bubble Sort
```pseudocode
BubbleSort(arr):
    n = length(arr)
    for i = 0 to n-2:
        for j = 0 to n-2-i:
            if arr[j] > arr[j+1]:
                swap(arr[j], arr[j+1])
```
**Analysis:** O(n²) - Two nested loops each running up to n times. Even with early termination optimization, worst case remains quadratic.

### Selection Sort
```pseudocode
SelectionSort(arr):
    n = length(arr)
    for i = 0 to n-2:
        minIndex = i
        for j = i+1 to n-1:
            if arr[j] < arr[minIndex]:
                minIndex = j
        swap(arr[i], arr[minIndex])
```
**Analysis:** O(n²) - Outer loop runs n times, inner loop runs (n-1) + (n-2) + ... + 1 = n(n-1)/2 times, resulting in quadratic complexity.

### Insertion Sort
```pseudocode
InsertionSort(arr):
    for i = 1 to length(arr)-1:
        key = arr[i]
        j = i - 1
        while j >= 0 and arr[j] > key:
            arr[j+1] = arr[j]
            j = j - 1
        arr[j+1] = key
```
**Analysis:** O(n²) worst case - For each element, may need to shift all previous elements. Best case O(n) when array is already sorted.

### Merge Sort
```pseudocode
MergeSort(arr, left, right):
    if left < right:
        mid = (left + right) / 2
        MergeSort(arr, left, mid)
        MergeSort(arr, mid+1, right)
        Merge(arr, left, mid, right)

Merge(arr, left, mid, right):
    // Merge two sorted subarrays in O(n) time
```
**Analysis:** O(n log n) - Divides array in half log n times, each level requires O(n) work to merge. Consistent across all cases.

### Quick Sort
```pseudocode
QuickSort(arr, low, high):
    if low < high:
        pi = Partition(arr, low, high)
        QuickSort(arr, low, pi-1)
        QuickSort(arr, pi+1, high)

Partition(arr, low, high):
    pivot = arr[high]
    i = low - 1
    for j = low to high-1:
        if arr[j] <= pivot:
            i = i + 1
            swap(arr[i], arr[j])
    swap(arr[i+1], arr[high])
    return i + 1
```
**Analysis:** Average O(n log n) with good pivot selection. Worst case O(n²) when pivot is always smallest/largest element.

### Heap Sort
```pseudocode
HeapSort(arr):
    BuildMaxHeap(arr)
    for i = length(arr)-1 to 1:
        swap(arr[0], arr[i])
        MaxHeapify(arr, 0, i)

BuildMaxHeap(arr):
    for i = length(arr)/2 to 0:
        MaxHeapify(arr, i, length(arr))
```
**Analysis:** O(n log n) - Building heap takes O(n), then n extractions each requiring O(log n) heapify operations.

### Counting Sort
```pseudocode
CountingSort(arr, k):
    count = array of size k+1, initialized to 0
    for i = 0 to length(arr)-1:
        count[arr[i]] = count[arr[i]] + 1
    
    index = 0
    for i = 0 to k:
        while count[i] > 0:
            arr[index] = i
            index = index + 1
            count[i] = count[i] - 1
```
**Analysis:** O(n + k) where k is the range of input values. Linear time but requires extra space proportional to input range.

### Radix Sort
```pseudocode
RadixSort(arr):
    max_val = findMax(arr)
    exp = 1
    while max_val / exp > 0:
        CountingSortByDigit(arr, exp)
        exp = exp * 10
```
**Analysis:** O(d(n + k)) where d is number of digits, n is array size, k is range of digits (typically 10). Efficient for integers with limited digits.

## Example Analysis: Finding Maximum Element

```pseudocode
FindMax(arr):
    max = arr[0]
    for i = 1 to length(arr)-1:
        if arr[i] > max:
            max = arr[i]
    return max
```

**Big-O Analysis Steps:**
1. **Identify basic operations:** Comparison `arr[i] > max` is the dominant operation
2. **Count operations:** Loop runs (n-1) times, performing one comparison each iteration
3. **Express in terms of input size:** Total comparisons = n-1
4. **Apply Big-O rules:** Drop constants and lower-order terms
5. **Result:** O(n) - Linear time complexity

**Why O(n):** Must examine each element exactly once to guarantee finding the maximum. Cannot be improved since any correct algorithm must look at all elements at least once.