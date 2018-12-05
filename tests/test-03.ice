
#include <Ice/BuiltinSequences.ice>

module Test
{

#ifdef TEST_MACRO
    class User
    {
        string name;
        Ice::StringSeq phones;
    };
#endif

    interface PhoneBook
    {
        User findByName(string name);
    };
};
