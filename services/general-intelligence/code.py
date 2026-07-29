import tkinter as tk

class Llama:
    def __init__(self, nom, age, sexe):
        self.nom = nom
        self.age = age
        self.sexe = sexe
        self.faim = True
        self.soif = False
        self.sommeil = False

    def manger(self):
        self.faim = False

    def boire(self):
        self.soif = False

    def dormir(self):
        self.sommeil = True

class Interface:
    def __init__(self, root):
        self.root = root
        self.llama = Llama("Lola", 2, "femme")
        self.menu = tk.OptionMenu(self.root, tk.StringVar(), "manger", "boire", "dormir")
        self.menu.pack()
        self.label_nom = tk.Label(self.root, text=self.llama.nom)
        self.label_nom.pack()

root = tk.Tk()
interface = Interface(root)
root.mainloop()
