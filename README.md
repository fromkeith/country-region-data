## This Fork

This is a fork of benkeen/country-region-data

I've changed:

* Added conversion code to change country code from 2 letter country codes to 3 letter country codes.
* This conversion also gets ride of region based 2 letter codes.
* Added shrink function to reduce file size of source json file. This changes the keys, and relies on previous sections.
  * Went from 325876 bytes to 66897 bytes. ~20% of original file size.