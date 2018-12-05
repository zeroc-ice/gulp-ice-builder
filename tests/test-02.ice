
#include <test-01.ice>

module Test
{
    interface PhoneBook
    {
        User findByName(string name);
    };
};
