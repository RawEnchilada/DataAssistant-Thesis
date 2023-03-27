-- Vertices

create class Person extends V;
create property Person.name String (mandatory true, notnull true);

create class City extends V;
create property City.name String (mandatory true, notnull true);

create class Company extends V;
create property Company.name String (mandatory true, notnull true);

create class Date extends V;
create property Date.date Date (mandatory true, notnull true);

create class Country extends V;
create property Country.name String (mandatory true, notnull true);

-- Edges

create class birthPlace extends E;

create class birthDate extends E;

create class employment extends E;
create property employment.profession String (mandatory true, notnull true);

create class foundingDate extends E;

create class capital extends E;

create class spouse extends E;

-- Sample data

create vertex Person set name = 'Alice';
create vertex Person set name = 'Bob';
create vertex Person set name = 'Charlie';
create vertex Person set name = 'Diana';
create vertex Person set name = 'Eve';

create vertex City set name = 'Amsterdam';
create vertex City set name = 'London';
create vertex City set name = 'Copenhagen';
create vertex City set name = 'Paris';

create vertex Company set name = 'GoodCompany';
create vertex Company set name = 'BadCompany';

create vertex Date set date = '1990-01-01';
create vertex Date set date = '1991-01-01';
create vertex Date set date = '1992-01-01';
create vertex Date set date = '1993-01-01';
create vertex Date set date = '1994-01-01';
create vertex Date set date = '2003-01-01';
create vertex Date set date = '2004-01-01';
create vertex Date set date = '2005-01-01';

create vertex Country set name = 'Netherlands';
create vertex Country set name = 'United Kingdom';
create vertex Country set name = 'Denmark';
create vertex Country set name = 'France';

-- Create edges

create edge birthPlace from (select from Person where name = 'Alice') to (select from City where name = 'Amsterdam');
create edge birthPlace from (select from Person where name = 'Bob') to (select from City where name = 'London');
create edge birthPlace from (select from Person where name = 'Charlie') to (select from City where name = 'Copenhagen');
create edge birthPlace from (select from Person where name = 'Diana') to (select from City where name = 'Paris');
create edge birthPlace from (select from Person where name = 'Eve') to (select from City where name = 'Amsterdam');

create edge birthDate from (select from Person where name = 'Alice') to (select from Date where date = '1990-01-01');
create edge birthDate from (select from Person where name = 'Bob') to (select from Date where date = '1991-01-01');
create edge birthDate from (select from Person where name = 'Charlie') to (select from Date where date = '1992-01-01');
create edge birthDate from (select from Person where name = 'Diana') to (select from Date where date = '1993-01-01');
create edge birthDate from (select from Person where name = 'Eve') to (select from Date where date = '1994-01-01');

create edge employment from (select from Person where name = 'Alice') to (select from Company where name = 'GoodCompany') set profession = 'Manager';
create edge employment from (select from Person where name = 'Bob') to (select from Company where name = 'GoodCompany') set profession = 'Developer';
create edge employment from (select from Person where name = 'Charlie') to (select from Company where name = 'GoodCompany') set profession = 'HR';
create edge employment from (select from Person where name = 'Diana') to (select from Company where name = 'BadCompany') set profession = 'Banker';
create edge employment from (select from Person where name = 'Eve') to (select from Company where name = 'BadCompany') set profession = 'Marketing';

create edge foundingDate from (select from Company where name = 'GoodCompany') to (select from Date where date = '2003-01-01');
create edge foundingDate from (select from Company where name = 'BadCompany') to (select from Date where date = '2004-01-01');

create edge capital from (select from Country where name = 'Netherlands') to (select from City where name = 'Amsterdam');
create edge capital from (select from Country where name = 'United Kingdom') to (select from City where name = 'London');
create edge capital from (select from Country where name = 'Denmark') to (select from City where name = 'Copenhagen');
create edge capital from (select from Country where name = 'France') to (select from City where name = 'Paris');

create edge spouse from (select from Person where name = 'Alice') to (select from Person where name = 'Bob');
create edge spouse from (select from Person where name = 'Bob') to (select from Person where name = 'Alice');
create edge spouse from (select from Person where name = 'Charlie') to (select from Person where name = 'Diana');
create edge spouse from (select from Person where name = 'Diana') to (select from Person where name = 'Charlie');








