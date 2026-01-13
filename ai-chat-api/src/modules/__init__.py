"""
Module recommendation system for psychology-informed chat guidance
"""

from .recommender import ModuleRecommender
from .module_config import MODULES, get_module_by_id

__all__ = ['ModuleRecommender', 'MODULES', 'get_module_by_id']
