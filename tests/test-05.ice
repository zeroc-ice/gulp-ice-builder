
#include <test-04.ice>

[["js:es6-module"]]

module Test
{
    interface PhoneBook
    {
        User findByName(string name);
    };
};
