import math
print("================\nSection 2\n================")




# number1 = int(input("enter your first number: "))
# number2 = int(input("enter your second number: "))
#
# if number1 >= number2:
#     print("number1 is largest")
# else:
#     print("number2 is largest")



# even or odd example
# number1 = int(input("Enter your number : "))
#
# if number1 % 2 == 0:
#     print("Your number is even ")
# else:
#     print("Your number is odd ")


# positive or negative example
# number1 = int(input("Enter your number : "))
#
# if number1 > 0:
#     print("Your number is positive ")
# elif number1 <0:
#     print("Your number is negative ")
# else:
#     print("Your number is 0 ")




# my_list = ["Abdulrahman", 55, 78.4, True, ["ahmed", 12]]
#
# print("my list : ", my_list)
# print("the length of my list : ", len(my_list))
# print("The first item in my list is :", my_list[0])
# print("The third item in my list is :", my_list[2])
# print("The items form index 0 to 2  in my list are :", my_list[0:3])
#
# my_list.append("mohamed")
# print("my list after append is : ", my_list)
#
# my_list.insert(0,12)
# print("my list after insert in specific index is : ", my_list)
#
# my_list.remove(True)
# print("my list after remove item 'True' : ", my_list)
#
# my_list.pop()
# print("my list after remove last item : ", my_list)
#
# my_list.pop(0)
# print("my list after remove first item : ", my_list)
#
# my_list.clear()
# print("my list after clear all items : ", my_list)
#
#
# del my_list





# calculator
# num1 = int(input("enter your first number : "))
# num2 = int(input("enter your second number : "))
# operation = input("enter your operation (+,-,*,/,%) : ")
#
# if operation == '+':
#     result = num1 + num2
#     print("result is : " + str(result))
# elif operation == '-':
#     result = num1 - num2
#     print("result is : " + str(result))
# elif operation == '/':
#     result = num1 / num2
#     print("result is : " + str(result))
# elif operation == '*':
#     result = num1 * num2
#     print("result is : " + str(result))
# elif operation == '%':
#     result = num1 % num2
#     print("result is : " + str(result))
# else:
#     print("Your operation not exist")


# -------------- loop --------------

# simple loop
# for i in range(0, 10):
#     print(i)

# loop on list
# my_list = ["Abdulrahman", 55, 78.4, True, ["ahmed", 12]]
# for i in my_list:
#     print(i)

# loop on condition (print all even numbers between 1 and N)
# number = int(input(" Enter your number : "))
# for i in range(1, number+1):
#     if i % 2 ==0:
#         print(i)




# factorial

# fact = 1
# for i in range(1, 6):
#     fact = fact * i
#
# print(fact)
# print(math.factorial(5))


# number 2 in lab 6

# number = int(input("Enter your number : "))
# even = odd = negative = positive = 0
# my_list = []
# for i in range(0, number):
#     x = int(input())
#     my_list.append(x)
#
# for i in my_list:
#     if i % 2 == 0:
#        even += 1
#     else:
#         odd += 1
#
#     if i >= 0:
#         positive += 1
#     elif i < 0:
#         negative += 1
#
# print(my_list)
# print("Even : ", even)
# print("odd : ", odd)
# print("positive : ", positive)
# print("negative : ", negative)













# print("Hello world !")
# print=("Hello world !")
#  print("Hello world !")
# print"Hello world !"
# print("Hello "world" !")
# prinr("Hello world !")
#
# num1 = input("Enter your number : ")
# num1 = int(input("Enter your number : "))
#
# if num1 > num2
#     print(num1)
# else:
#     print(num2)
#
#




# x = int(input("Enter your number : "))
# y = int(input("Enter your number : "))
# operator = input("Enter your operator (+,-,*,/,%) : ")
#
# if operator == '+':
#     result = x + y
#     print("Result is : " + str(result))
# elif operator == '-':
#     result = x - y
#     print("Result is : " + str(result))
# elif operator == '*':
#     result = x * y
#     print("Result is : " + str(result))
# elif operator == '/':
#     result = x / y
#     print("Result is : " + str(result))
# else:
#     print("Your operator is not correct")
#

# number = int(input("Enter your number : "))
#
# if number >0:
#     print("Your number is positive")
# elif number ==0:
#     print("Your number is zero")
# else:
#     print("Your number is negative")
#


# number1 = int(input("Enter your first number : "))
# number2 = int(input("Enter your second number : "))
# number3 = int(input("Enter your third number : "))
#
# if number1 >= number2 and number1 >= number3:
#     print("The largest number is : " + str(number1))
# elif number2 >= number3:
#     print("The largest number is : " + str(number2))
# else:
#     print("The largest number is : " + str(number3))