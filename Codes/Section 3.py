import random
import math

print("================\n ; : ; : ; : ;\n================")


# remove all "a" from list
# my_list = ["a", "k", "k", "a", "a", "k"]
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
# vowels = ["i", "o", "u", "e", "a"]
# for i in my_text:
#     if i in vowels:
#         count += 1
#
# print("Number of vowels in your text is:", count)

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
# print(my_list)


# Create list using loop and range
# my_list = []
# for i in range(1, 31):
#     my_list.append(i)
# print(my_list)


# Print All Multiples of 5 in a Range
# for i in range(5, 51):
#     if i % 5 == 0:
#         print(i)

# Demonstrate break and continue
# If i is divisible by 4 → continue
# If i = 18 → break
# Otherwise → print i
# for i in range(1, 26):
#     if i % 4 == 0:
#         continue
#     if i == 18:
#         break
#     print(i)

# Count Numbers > 100 without List
# print("Enter 10 numbers :")
# count = 0
#
# for i in range(10):
#     x = int(input())
#     if x > 100:
#         count += 1
#
# print("Output :", count)

# 5×5 Multiplication Table using Nested Loops
# for i in range(1, 6):
#     for j in range(1, 6):
#         print(f"{i * j}\t", end="")
#     print()


# String Length and Indexing
# name = input("Enter your full name : ")
# print("Total characters :", len(name))
# print("First character :", name[0])
# print("Last character :", name[-1])





# name = "abdulrahman ahmed ali"
# # print("K"+name[1:])
#
#
# print(name.capitalize())
# print(name.title())





# vowels = ["a", "e", "i", "o", "u"]
# name = "abdulrahman ahmed ali"
# count = 0
# for i in name:
#     if i in vowels:
#         count +=1
# print(count)







# for chr in name:
#     print(chr, end=" ")

# print(name)
# print(name[0])
# print(name[-1])
# print(name[:5])
# print(name[1:5])
# print(name[:-1:2])
# print(name[::2])






# print(name[::-1])
















# Count Digits in a String
# Input ="ab12c3"
# count = 0
# for i in Input:
#     if i.isdigit():
#         count += 1
# print(count)

# Sum of Digits in a Number
# number = 12345
# sum_digits = 0
# for i in str(number):
#     sum_digits += int(i)
# print("Sum of digits :", sum_digits)


# text = input("Enter a string: ")
#
# freq = {}
# for char in text:
#     if char in freq:
#         freq[char] += 1
#     else:
#         freq[char] = 1
# for char, count in freq.items():
#     print(f"'{char}': {count}")









name = input("enter name : ")
digit = 0
space = 0
letter = 0

for i in name:
    if i.isspace():
        space += 1
    elif i.isalpha():
        letter += 1
    elif i.isdigit():
        digit +=1
print("digit : ", digit)
print("letter : ", letter)
print("space : ", space)















print("Choose conversion type:")
print("1) Convert from binary to decimal")
print("2) Convert from decimal to binary")
choice = input("Enter 1 or 2: ")
























