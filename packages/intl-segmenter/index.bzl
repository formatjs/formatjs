"""
This module provides utility functions for intl-segmenter. 
"""

def unicode_file_name(external_path):
    return external_path.replace("@", "").replace("//file", "")
