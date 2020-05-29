from flask import Flask, render_template, request

import os


app = Flask(__name__)
app.secret_key = 'Ionogramas Unach'
path = os.path.join(os.path.dirname(__file__), 'Ionogramas')

@app.route('/', methods=['GET', 'POST'])
def index():
  files = []
    
  iono = 1
  maxIono = 96
  archivo = 'AUG118.01'

  # r=root, d=directories, f = files
  for r, d, f in os.walk(path):
      f.sort()
      for file in f:
          files.append(file)
      break

  return render_template(
    "index.html", iono=iono, files=files, archivo=archivo, maxIono=maxIono,)


@app.route('/api/b', methods=['GET', 'POST'])
def array():

    archivo = request.args.get('archivo', default="AUG118.01", type=str)

    with open(os.path.join(path, archivo), "rb") as f:
        data = f.read()
        return data

if __name__ == "__main__":
    app.run()
