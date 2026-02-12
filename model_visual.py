import os
import json
import argparse

# ---------- Framework imports ----------

# TensorFlow / Keras
try:
    import tensorflow as tf
    from tensorflow.keras.models import load_model
    from tensorflow.lite.python.interpreter import Interpreter
    TF_AVAILABLE = True
except Exception:
    TF_AVAILABLE = False

# PyTorch
try:
    import torch
    import torch.nn as nn
    TORCH_AVAILABLE = True
except Exception:
    TORCH_AVAILABLE = False

# ONNX
try:
    import onnx
    ONNX_AVAILABLE = True
except Exception:
    ONNX_AVAILABLE = False


# ---------- Helpers ----------

def safe_value(x):
    """Convert numpy/tensor values into JSON-safe format."""
    try:
        if hasattr(x, "tolist"):
            return x.tolist()
        return x
    except:
        return str(x)


# ---------- Analyzers ----------

def tensor_shape(t):
    """Safely extract tensor shape."""
    try:
        if isinstance(t, (list, tuple)):
            return [tensor_shape(x) for x in t]

        shape = getattr(t, "shape", None)
        if shape is None:
            return None

        return [dim if dim is not None else -1 for dim in shape]

    except:
        return None


def analyze_keras(path):

    model = load_model(path, compile=False)

    summary = {
        "model_name": model.name,
        "inputs": tensor_shape(model.inputs),
        "outputs": tensor_shape(model.outputs),
        "layers": []
    }

    for layer in model.layers:

        # Tensor shapes
        in_shape = tensor_shape(getattr(layer, "input", None))
        out_shape = tensor_shape(getattr(layer, "output", None))

        # Params
        try:
            params = layer.count_params()
        except:
            params = 0

        # Connections
        inbound = []
        try:
            for node in layer._inbound_nodes:
                inbound.append(str(node))
        except:
            pass

        summary["layers"].append({
            "name": layer.name,
            "type": layer.__class__.__name__,
            "input_tensor_shape": in_shape,
            "output_tensor_shape": out_shape,
            "params": params,
            "inbound_nodes": inbound
        })

    return summary




def analyze_pytorch(path):
    model = torch.load(path, map_location="cpu")

    if isinstance(model, dict):
        return {"info": "State dict detected", "keys": list(model.keys())}

    if isinstance(model, nn.Module):
        layers = []
        for name, module in model.named_modules():
            layers.append({
                "name": name,
                "class": module.__class__.__name__,
            })
        return {"name": str(type(model)), "layers": layers}

    return {"info": "Unknown PyTorch format"}


def analyze_onnx(path):
    model = onnx.load(path)
    nodes = []

    for node in model.graph.node:
        nodes.append({
            "op_type": node.op_type,
            "inputs": list(node.input),
            "outputs": list(node.output),
        })

    return {"name": model.graph.name, "nodes": nodes}


def analyze_tflite(path):
    interpreter = Interpreter(model_path=path)
    interpreter.allocate_tensors()

    tensors = []
    for t in interpreter.get_tensor_details():
        tensors.append({
            "name": t["name"],
            "shape": safe_value(t["shape"]),
            "dtype": str(t["dtype"]),
        })

    return {"name": os.path.basename(path), "tensors": tensors}

# ---------- Recommendation Engine ----------

def generate_recommendations(summary):

    recs = []

    layers = summary.get("layers", [])
    if not layers:
        return ["No layer data available for analysis"]

    total_params = 0
    dense_params = 0
    conv_layers = 0
    dense_layers = 0
    batchnorm_found = False
    activations = []

    for layer in layers:

        params = layer.get("params", 0)
        total_params += params

        name = layer.get("type", "").lower()

        if "dense" in name:
            dense_layers += 1
            dense_params += params

        if "conv" in name:
            conv_layers += 1

        if "batchnorm" in name:
            batchnorm_found = True

        if "activation" in name:
            activations.append(name)

    # ---------- Rules ----------

    if len(layers) < 10:
        recs.append(
            "Model is shallow → consider deeper feature extraction layers."
        )

    if dense_params > total_params * 0.5:
        recs.append(
            "Dense layers dominate parameters → use GlobalAveragePooling or bottleneck layers."
        )

    if not batchnorm_found:
        recs.append(
            "No BatchNorm detected → add normalization for better training stability."
        )

    if dense_layers > conv_layers:
        recs.append(
            "Architecture is dense-heavy → convolutional layers may improve feature learning."
        )

    if len(activations) > 5:
        recs.append(
            "Many activation layers detected → verify activation placement efficiency."
        )

    if total_params > 10_000_000:
        recs.append(
            "Model is large → consider pruning or lightweight architectures."
        )

    if not recs:
        recs.append("Architecture looks balanced — no major structural issues detected.")

    return recs

# ---------- Main ----------

def main():
    parser = argparse.ArgumentParser(description="Analyze ML model structure")
    parser.add_argument("model_file", help="Path to model file")
    parser.add_argument("--output", default="model_summary.json")

    args = parser.parse_args()

    path = args.model_file
    ext = os.path.splitext(path)[1].lower()

    print(f"\n🔍 Analyzing: {path}")

    try:

        if ext in [".h5", ".keras"] and TF_AVAILABLE:
            result = analyze_keras(path)

        elif ext in [".pt", ".pth"] and TORCH_AVAILABLE:
            result = analyze_pytorch(path)

        elif ext == ".onnx" and ONNX_AVAILABLE:
            result = analyze_onnx(path)

        elif ext == ".tflite" and TF_AVAILABLE:
            result = analyze_tflite(path)

        else:
            raise RuntimeError("Unsupported format or missing libraries")

        # Generate recommendations (only for keras-style summaries)
        if "layers" in result:
            result["recommendations"] = generate_recommendations(result)

        with open(args.output, "w") as f:
            json.dump(result, f, indent=2)


        print("✅ Analysis successful!")
        print(f"📄 Saved → {args.output}")

    except Exception as e:
        print("\n❌ Error:", e)


if __name__ == "__main__":
    main()
