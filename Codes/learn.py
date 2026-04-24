print("Hi , Abdulrahman")

# num1 = int(input("Enter your number : "))
# if num1 % 2 == 0:
#     print("even")
# else:
#     print("odd")
# 
# name = "asasd"
# print(name)
# 
# for i in range(0, 10):
#     print(i)
# 
# mostafa = int(input("enter your number ya mostafa : "))

#
# if mostafa >= 0:
#     print("positive")
# else:
#     print("negative")
# 
# 

# c = int(input("enter your number : "))
#
# num1 = "we"
#
# print(c)
# print(num1)
#
# if c > 0:
#     print("positive")
# elif c < 0:
#     print("negative")
# else:
#     print("zero")
#
# print("hello")

# name = "     ahmed "
# print(name.upper())

#
# is_exist = True
# while(is_exist):
#     num1 = int(input("enter your first number : "))
#     num2 = int(input("enter your second number : "))
#     operation = input("enter your operation : ")
#
#     if operation == '+':
#         result = num1 + num2
#         print("result is : " + str(result))
#     elif operation == '-':
#         result = num1 - num2
#         print("result is : " + str(result))
#     elif operation == '/':
#         result = num1 / num2
#         print("result is : " + str(result))
#     elif operation == '*':
#         result = num1 * num2
#         print("result is : " + str(result))
#     elif operation == '%':
#         result = num1 % num2
#         print("result is : " + str(result))
#     else:
#         print("Your operation not exist")
#
#     exist = input("do you want to continue : Y/N ")
#     if exist == 'Y':
#         is_exist = True
#     else:
#         is_exist = False


# print("ahmed" + "ahmed")
# print("ahmed", "ahmed", 158)
name = "ahmed mohamed ahmed "
# print(name)
# print(len(name))
# print(name.upper())
# print(name.lower())
# print(name.strip())
print(name.capitalize())
print(name.title())
# print(name.find("mohamed"))     # -1
# print(name.index("mohamed"))    # error
# print(name.count("m"))
# print(name.count("m"))
# print(name.replace("h","k"))
print(name.split())
# print("hello" == "hello")
# print(name[:5])
# print(name[5:])
# print(name[1:5])
print("mohamed" in name)
#
# number = 44
# print("don't\tworry \'jjj")
#
# name_12 = "aa"
# # phone = eval(input("enter 1 :"))
# # phone2 = eval(input("enter 3 :"))
# # print(phone+phone2)
# print(2*"la "+"land")

























Books = ["Math", "Science", "History", "Art"]
index = int(input("enter book index you want to edit :"))
new_name = input("enter new book name : ")
Books[index] = new_name
print(Books)