# ai/dependencies/model_dependencies.py

from llm.model_router import ModelRouter


def get_model_router() -> ModelRouter:

    return ModelRouter()