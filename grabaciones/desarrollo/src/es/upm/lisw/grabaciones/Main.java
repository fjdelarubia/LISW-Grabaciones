package es.upm.lisw.grabaciones;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.URL;
import java.net.URLConnection;

import javax.sound.sampled.AudioFileFormat;
import javax.sound.sampled.AudioFormat;
import javax.sound.sampled.AudioInputStream;
import javax.sound.sampled.AudioSystem;
import javax.sound.sampled.DataLine;
import javax.sound.sampled.LineUnavailableException;
import javax.sound.sampled.TargetDataLine;

import org.apache.commons.io.FileUtils;

public class Main {

	// record duration, in milliseconds
	static final long RECORD_TIME = 60000; // 1 minute

	// path of the wav file
	File wavFile = new File("E:/Test/RecordAudio.wav");

	// format of audio file
	AudioFileFormat.Type fileType = AudioFileFormat.Type.WAVE;

	// the line from which audio data is captured
	TargetDataLine line;

	/**
	 * Defines an audio format
	 */
	AudioFormat getAudioFormat() {
		float sampleRate = 16000;
		int sampleSizeInBits = 8;
		int channels = 2;
		boolean signed = true;
		boolean bigEndian = true;
		AudioFormat format = new AudioFormat(sampleRate, sampleSizeInBits,
				channels, signed, bigEndian);
		return format;
	}

	/**
	 * Captures the sound and record into a WAV file
	 */
	void start() {
		try {
			AudioFormat format = getAudioFormat();
			DataLine.Info info = new DataLine.Info(TargetDataLine.class, format);

			// checks if system supports the data line
			// if (!AudioSystem.isLineSupported(info)) {
			// System.out.println("Line not supported");
			// System.exit(0);
			// }
			line = (TargetDataLine) AudioSystem.getLine(info);
			line.open(format);
			line.start(); // start capturing

			System.out.println("Start capturing...");

			AudioInputStream ais = new AudioInputStream(line);

			try {
				URLConnection conn = new URL(
						"http://radiolive.rtve.es/radio4.m3u").openConnection();
				InputStream is = conn.getInputStream();

				OutputStream outstream = new FileOutputStream(new File(
						"prueba.wav"));
				byte[] buffer = new byte[4096];
				int len;
				long t = System.currentTimeMillis();
				while ((len = is.read(buffer)) > 0
						&& System.currentTimeMillis() - t <= 5000) {
					outstream.write(buffer, 0, len);
				}
				outstream.close();
			} catch (Exception e) {
				System.out.print(e);
			}

			System.out.println("Start recording...");

			// start recording
			AudioSystem.write(ais, fileType, wavFile);

		} catch (LineUnavailableException ex) {
			ex.printStackTrace();
		} catch (IOException ioe) {
			ioe.printStackTrace();
		}
	}

	/**
	 * Closes the target data line to finish capturing and recording
	 */
	void finish() {
		line.stop();
		line.close();
		System.out.println("Finished");
	}

	/**
	 * Entry to run the program
	 */
	public static void main(String[] args) {
		//http://195.55.74.224/cope/cadena100.mp3
		 try{ 
			 	File file;
			 	URL url = new URL("http://radiolive.rtve.es/radio4.m3u");
				String tDir = System.getProperty("java.io.tmpdir");
				String path = tDir + "tmp" + ".m3u";
				file = new File(path);
				file.deleteOnExit();
				FileUtils.copyURLToFile(url, file);
				
				FileInputStream fis = new FileInputStream(file);
				 
				//Construct BufferedReader from InputStreamReader
				BufferedReader br = new BufferedReader(new InputStreamReader(fis));
			 
				String lurl = "";
				
				String line = null;
				while ((line = br.readLine()) != null) {
					System.out.println(line);
					if(line.startsWith("http"))
						lurl = line;
				}
			 
				br.close();
				lurl = "http://195.55.74.224/cope/cadena100.mp3";
				  URLConnection conn = new URL(lurl).openConnection();
	          //  URLConnection conn = new URL("http://radio4.rtveradio.cires21.com/radio4/mp3/icecast.audio").openConnection();
	            InputStream is = conn.getInputStream();
	 
	            OutputStream outstream = new FileOutputStream(new File("output.mp3"));
	            byte[] buffer = new byte[4096];
	            int len;
	            long t = System.currentTimeMillis();
	            while ((len = is.read(buffer)) > 0 && System.currentTimeMillis() - t <= 5000) {
	                outstream.write(buffer, 0, len);
	            } 
	            outstream.close();
	        } 
	        catch(Exception e){
	            System.out.print(e);
	        } 
		



	}
}
