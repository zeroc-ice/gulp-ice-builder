
#include <test-06.ice>

[["js:es6-module", "js:module:test"]]

module Test
{
    interface PhoneBook
    {
        User findByName(string name);
    };
};
