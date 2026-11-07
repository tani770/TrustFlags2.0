import unittest

# 1. The BROKEN code being tested (Multiplies instead of adds)
def add_numbers(a, b):
    """Returns the sum of two numbers (Intentionally broken!)."""
    return a * b  # <-- This bug will cause the tests to fail

# 2. The test suite (Stays exactly the same)
class TestAddNumbers(unittest.TestCase):
    
    def test_add_positive_numbers(self):
        # 3 * 5 will equal 15, but the test expects 8
        result = add_numbers(3, 5)
        self.assertEqual(result, 8)

    def test_add_negative_numbers(self):
        # -1 * -1 will equal 1, but the test expects -2
        result = add_numbers(-1, -1)
        self.assertEqual(result, -2)

    def test_add_float_numbers(self):
        # 1.5 * 2.5 will equal 3.75, but the test expects 4.0
        result = add_numbers(1.5, 2.5)
        self.assertEqual(result, 4.0)

# 3. Execution block
if __name__ == '__main__':
    unittest.main()
