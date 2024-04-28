from flask import Flask, render_template, url_for, request, redirect
import pymongo
from werkzeug.utils import secure_filename
import os

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'static'
client=pymongo.MongoClient('localhost', 27017)
db = client['amani']
col = db['story']

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/story')
def story():
    data1 = col.find({"approved":True})
    for x in data1:
        data=x
    print(data)
    return render_template('stories.html',data=data)

@app.route('/somalia')
def somalia():
    return render_template('country.html')

@app.route('/funds')
def funds():
    return render_template('fundraise.html')

@app.route('/mentor')
def mentor():
    return render_template('mentor.html')

@app.route('/store', methods=['POST'])
def store():
    fname = request.form['firstname']
    lname = request.form['lastname']
    email= request.form['email']
    phone = request.form['phone']
    story = request.form['message']
    file = request.files['upload']
    filename=""
    if file :
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
    val = {"firstname":fname, "lastname":lname, "email":email, "phone":phone, "story":story, "file":filename,"approved":False}
    col.insert_one(val)

    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)