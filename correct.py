import unittest

# 1. The code you want to test
def add_numbers(a, b):
    """Returns the sum of two numbers."""
    return a + b

# 2. The test suite
class TestAddNumbers(unittest.TestCase):
    
    def test_add_positive_numbers(self):
        # Test case 1: Adding two positive integers
        result = add_numbers(3, 5)
        self.assertEqual(result, 8)

    def test_add_negative_numbers(self):
        # Test case 2: Adding two negative integers
        result = add_numbers(-1, -1)
        self.assertEqual(result, -2)

    def test_add_float_numbers(self):
        # Test case 3: Adding floating-point numbers
        result = add_numbers(1.5, 2.5)
        self.assertEqual(result, 4.0)

# 3. Execution block
if __name__ == '__main__':
    unittest.main()
