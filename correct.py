import math

def calculate_harmony(x):
    print("Starting calculation...")
    
    # Corrected: Explicitly convert input to integer to prevent TypeError
    try:
        x = int(x)
    except ValueError:
        print("Error: Input must be a number.")
        return None

    # Corrected: Perform arithmetic addition instead of string concatenation
    y = x + 10  

    # Corrected: Added missing colon
    if y > 5:
        # Corrected: Defined the variable before printing it
        existing_variable = f"y is greater than 5 (y = {y})"
        print(existing_variable) 

    # Corrected: Properly initialized the list
    my_list = [10, 20, 30]
    # Corrected: Used a valid index within the list's range
    print(f"List item at index 0: {my_list[0]}") 

    my_dict = {"a": 1, "b": 2}
    # Corrected: Used .get() to handle missing keys safely without raising a KeyError
    print(f"Dictionary access for key 'c': {my_dict.get('c', 'Key not found')}") 

    # Corrected: Added a check to prevent a ZeroDivisionError
    divisor = 0
    if divisor != 0:
        result = 100 / divisor
    else:
        print("Division by zero prevented! Setting result to 0.")
        result = 0
        
    return result

# Corrected: Used a real, existing attribute from the math module
print(f"Square root of 16: {math.sqrt(16)}")

# Corrected: Added the missing closing parenthesis
print("Done!")

# Execute the function to show it works
final_result = calculate_harmony(5)
print(f"Final Function Result: {final_result}")
