import random
import math

print("================\n ; : ; : ; : ;\n================")

# multiplication table
# number = int(input("Enter your number : "))
# for i in range(1, 13):
#     print(f"{number} x {i} = {number * i}")


# All divisors of a number
# number = int(input("Enter your number : "))
# sum=0
# for i in range(1, number):
#     if number % i == 0:
#         sum = sum + i
#
# print("The divisors of", number, "are :", sum)


# perfect number
# number = int(input("Enter your number : "))
# sum = 0
# for i in range(1, number):
#     if number % i == 0:
#         sum += i
# if sum == number:
#     print("perfect")
# else:
#     print("not perfect")


# find max number in list
# numbers = int(input("Enter your number : "))
# list = []
# for i in range(1, numbers+1):
#     x = int(input())
#     list.append(x)
# print("Your list is : ", list)
# # print max number in list
# max_number = list[0]
# for i in list:
#     if i > max_number:
#         max_number = i
# print("The max number in your list is : ", max_number)


# find even - odd - negative - positive in list
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



# print Symbol repetition
# symbol = input("Enter your symbol : ")
# number = int(input("Enter your number : "))
#
# my_list = []
# for i in range(0, number):
#     item = int(input("Enter your number : "))
#     my_list.append(item)
#
# for i in my_list:
#     print(symbol * i)



# remove all "a" from list
# my_list = ["a", "k", "k", "a", "a", "k"]
# ["a", "k", "k", "a", "a", "k"] i = 0 -> "a"
# ["k", "k", "a", "a", "k"] i = 1
# ["k", "k", "a", "a", "k"] i = 2 -> "a"
# ["k", "k", "a", "k"] i = 3


# for i in my_list[:]:
#     if i == "a":
#         my_list.remove(i)
#
# print(my_list)


# multiplication tables from 1 to 10
# for i in range(1, 11):
#     print(f"------ table of {i} ------")
#     for j in range(0, 13):
#         print(f"{i} * {j} = {i*j}")


# count vowels in text
# my_text = input("enter your test : ")
# count = 0

# for i in  my_text:
#     if i in ["i", "o", "u", "e", "a"]:
#         count += 1
#
# print(count)


# remove duplicates from list
# my_list = ["ahmed", 55, 55, 55, "ahmed", "k", "k", "a", 55]
# uniqe_list = []
# for i in my_list:
#     if i not in uniqe_list:
#         uniqe_list.append(i)
#
# print(uniqe_list)


# find longest word in sentence
# sentence = input("enter your sentence : ")
# words = sentence.split()
#
# longest = words[0]
# for word in words:
#     if len(word) > len(longest):
#         longest = word
#
# print(longest)


# count letters , digits , spaces in sentence
# sentence = input("enter your sentence : ")
#
# letter = digit = space = 0
#
# for ch in sentence:
#     if ch.isalpha():
#         letter += 1
#     elif ch.isdigit():
#         digit += 1
#     elif ch.isspace():
#         space += 1
#
# print("letters : ", letter)
# print("digits : ", digit)
# print("spaces : ", space)


# convert all strings in list to lowercase
# my_list = ["Ahmed", 55, 55, 55, "Ahmed", "K", "k", "a", 55]
# for i in range(0, len(my_list)):
#     if isinstance(my_list[i], str):
#         my_list[i] = my_list[i].upper()
#     elif isinstance(my_list[i], int):
#         my_list[i] = my_list[i] *2
#
# print(my_list)


# guess the number game
# number = random.randint(0, 100)
# while True:
#     guess = int(input("Enter your number : "))
#
#     if guess > number:
#         print("Higher !!")
#     elif guess < number:
#         print("lower !!")
#     else:
#         print("You Get it !!!!")
#         break

# convert grades to letters
# grades = [55, 60, 70, 78, 99, 80, 45, 65]
# letters =[]
# for i in grades:
#     if i >= 50 and i < 65:
#         letters.append("D")
#     elif i >= 65 and i < 75:
#         letters.append("C")
#     elif i >= 75 and i < 90:
#         letters.append("B")
#     elif i >= 90:
#         letters.append("A")
#     else:
#         letters.append("F")
# print(grades)
# print(letters)

# break and continue

# break
# for i in range(0, 11):
#     if i==5:
#         break
#     print(i)

# continue
# for i in range(0, 11):
#     if i == 5:
#         continue
#     print(i)


















# list = [5, 5, 4, 7, 5, 15, -10, 56]
#
# odd = 0
# even = 0
# pos = 0
# neg = 0
#
# for i in list:
#     if i % 2 ==0:
#         even +=1
#     else:
#         odd += 1
#
#     if i > 0:
#         pos += 1
#     else:
#         neg += 1
#
# print("even : ", even)
# print("odd : ", odd)
# print("pos : ", pos)
# print("neg : ", neg)
































# modify list : double integers and uppercase strings
# my_list = [5, 5, 4, 7, 5, "a", "ahmed"]
# for i in range(len(my_list)):
#     if isinstance(my_list[i], str):
#         my_list[i] = my_list[i].upper()
#     elif isinstance(my_list[i], int):
#         my_list[i] = my_list[i] * 2
# print(my_list)





















# name = "Abdulrahmanaaaaaaaaa"
# print(len(name))
#
#
# for i in range(10):
#     if i == 5:
#         break
#     print(i)



number = random.randint(0,100)

























